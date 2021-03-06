import AGCollection from '/node_modules/ag-collection/ag-collection.js';

function getComponent(options) {
  let {socket, publicInfo} = options;

  return {
    data: function () {
      this.accountCollection = new AGCollection({
        socket,
        type: 'Account',
        view: 'accountIdSearchView',
        viewParams: {
          searchString: '',
        },
        viewPrimaryKeys: null,
        fields: [],
        pageOffset: 0,
        realtimeCollection: false,
        pageSize: 4
      });
      (async () => {
        for await (let {error} of this.accountCollection.listener('error')) {
          console.error(error);
        }
      })();

      return {
        publicInfo,
        accountId: null,
        dropdownActive: false,
        amount: null,
        data: null,
        error: null,
        accounts: this.accountCollection.value,
        isTransferModalActive: false,
        isDebitModalActive: false
      };
    },
    destroyed: function () {
      this.accountCollection.destroy();
    },
    methods: {
      openTransferModal: function () {
        this.isTransferModalActive = true;
      },
      closeTransferModal: function () {
        this.clearForm();
        this.isTransferModalActive = false;
      },
      openDebitModal: function () {
        this.isDebitModalActive = true;
      },
      closeDebitModal: function () {
        this.clearForm();
        this.isDebitModalActive = false;
      },
      clearForm: function () {
        this.error = null;
        this.accountId = null;
        this.amount = null;
        this.data = null;
      },
      hideDropdown: function () {
        this.dropdownActive = false;
      },
      searchForAccount: function () {
        this.dropdownActive = true;
        this.accountCollection.viewParams = {
          searchString: this.accountId
        };
        this.accountCollection.reloadCurrentPage();
      },
      selectAccount: function (accountId) {
        this.dropdownActive = false;
        this.accountId = accountId;
      },
      sendTransfer: async function () {
        if (!this.accountId) {
          this.error = 'Could not execute the transfer. The account ID was not provided.';
          return;
        }
        if (!this.amount || this.amount < 0) {
          this.error = 'Could not execute the transfer. The amount was not provided or was invalid.';
          return;
        }
        if (publicInfo.cryptocurrency.unit == null) {
          this.error = 'Could not execute the transfer. The cryptocurrency unit value could not be determined.';
          return;
        }
        let accountId = this.accountId.trim();
        let unitAmount = parseFloat(this.amount);
        let totalAmount = Math.round(unitAmount * parseInt(publicInfo.cryptocurrency.unit));
        let totalAmountString = totalAmount.toString();

        try {
          await socket.invoke('transfer', {
            amount: totalAmountString,
            toAccountId: accountId,
            data: this.data
          });
        } catch (error) {
          this.error = error.message;
          return;
        }
        this.clearForm();
        this.closeTransferModal();
      },
      sendDebit: async function () {
        if (!this.amount || this.amount < 0) {
          this.error = 'Could not execute the debit. The amount was not provided or was invalid.';
          return;
        }
        if (publicInfo.cryptocurrency.unit == null) {
          this.error = 'Could not execute the debit. The cryptocurrency unit value could not be determined.';
          return;
        }
        let unitAmount = parseFloat(this.amount);
        let totalAmount = Math.round(unitAmount * parseInt(publicInfo.cryptocurrency.unit));
        let totalAmountString = totalAmount.toString();

        try {
          await socket.invoke('debit', {
            amount: totalAmountString,
            data: this.data
          });
        } catch (error) {
          this.error = error.message;
          return;
        }
        this.clearForm();
        this.closeDebitModal();
      }
    },
    template: `
      <div class="component-container container is-fullhd" @click="hideDropdown">
        <input type="button" class="button is-primary" value="Make a transfer" @click="openTransferModal" />
        <input type="button" class="button is-primary" value="Make a debit" @click="openDebitModal" />

        <div v-bind:class="{'modal': true, 'is-active': isTransferModalActive}">
          <div class="modal-background"></div>
          <div class="modal-card">
            <header class="modal-card-head">
              <span class="modal-card-title">Make a transfer</span>
              <button class="delete" aria-label="close" @click="closeTransferModal"></button>
            </header>
            <section class="modal-card-body">
              <div v-if="error" class="has-text-danger field">
                <span>{{error}}</span>
              </div>
              <div class="field">
                <div v-bind:class="{'dropdown': true, 'is-active': dropdownActive && accounts.length > 0, 'make-transfer-dropdown': true}">
                  <div class="dropdown-trigger make-transfer-dropdown-trigger">
                    <label class="label" for="make-transfer-account-id">
                      To account</span>
                    </label>
                    <input id="make-transfer-account-id" type="text" class="input make-transfer-account-id-input" v-model="accountId" @keydown.enter="sendTransfer" @input="searchForAccount">
                  </div>
                  <div class="dropdown-menu make-transfer-dropdown-menu" id="dropdown-menu" role="menu">
                    <div class="dropdown-content">
                      <template v-for="account of accounts">
                        <a href="javascript:void(0);" class="dropdown-item" @click="selectAccount(account.id)">
                          {{account.id}}
                        </a>
                      </template>
                    </div>
                  </div>
                </div>
              </div>
              <div class="field">
                <label class="label" for="make-transfer-amount">
                  Amount ({{publicInfo.cryptocurrency.symbol}})
                </label>
                <input id="make-transfer-amount" type="text" v-model="amount" class="input" @keydown.enter="sendTransfer">
              </div>
              <div class="field">
                <label class="label" for="make-transfer-data">
                  Data
                </label>
                <input id="make-transfer-data" type="text" v-model="data" class="input" @keydown.enter="sendTransfer">
              </div>
            </section>
            <footer class="modal-card-foot">
              <button class="button is-link" @click="sendTransfer">Send transfer</button>
              <button class="button" @click="closeTransferModal">Cancel</button>
            </footer>
          </div>
        </div>

        <div v-bind:class="{'modal': true, 'is-active': isDebitModalActive}">
          <div class="modal-background"></div>
          <div class="modal-card">
            <header class="modal-card-head">
              <span class="modal-card-title">Make a debit</span>
              <button class="delete" aria-label="close" @click="closeDebitModal"></button>
            </header>
            <section class="modal-card-body">
              <div v-if="error" class="has-text-danger field">
                <span>{{error}}</span>
              </div>
              <div class="field">
                <label class="label" for="make-transfer-amount">
                  Amount ({{publicInfo.cryptocurrency.symbol}})
                </label>
                <input id="make-transfer-amount" type="text" v-model="amount" class="input" @keydown.enter="sendDebit">
              </div>
              <div class="field">
                <label class="label" for="make-transfer-data">
                  Data
                </label>
                <input id="make-transfer-data" type="text" v-model="data" class="input" @keydown.enter="sendDebit">
              </div>
            </section>
            <footer class="modal-card-foot">
              <button class="button is-link" @click="sendDebit">Send debit</button>
              <button class="button" @click="closeDebitModal">Cancel</button>
            </footer>
          </div>
        </div>
      </div>
    `
  };
}

export default getComponent;
