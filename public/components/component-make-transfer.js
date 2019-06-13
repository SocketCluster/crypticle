import AGCollection from '/node_modules/ag-collection/ag-collection.js';

function getComponent(options) {
  let {socket, mainInfo} = options;

  return {
    data: function () {
      return {
        mainInfo,
        accountId: null,
        amount: null,
        data: null,
        error: null,
        isModalActive: false
      };
    },
    methods: {
      openModal: function () {
        this.isModalActive = true;
      },
      closeModal: function () {
        this.isModalActive = false;
      },
      clearForm: function () {
        this.error = null;
        this.accountId = null;
        this.amount = null;
        this.data = null;
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
        if (mainInfo.cryptocurrency.unit == null) {
          this.error = 'Could not execute the transfer. The cryptocurrency unit value could not be determined.';
          return;
        }
        let accountId = this.accountId.trim();
        let unitAmount = parseFloat(this.amount);
        let totalAmount = Math.round(unitAmount * parseInt(mainInfo.cryptocurrency.unit));
        let totalAmountString = totalAmount.toString();

        try {
          await socket.invoke('transfer', {
            amount: totalAmountString,
            toAccountId: accountId,
            data: this.data
          });
        } catch (error) {
          this.clearForm();
          this.error = error.message;
          return;
        }
        this.clearForm();
        this.closeModal();
      }
    },
    template: `
      <div class="component-container container is-fullhd">
        <input type="button" class="button is-primary" value="Make a transfer" @click="openModal" />

        <div v-bind:class="{'modal': true, 'is-active': isModalActive}">
          <div class="modal-background"></div>
          <div class="modal-card">
            <header class="modal-card-head">
              <span class="modal-card-title">Make a transfer</span>
              <button class="delete" aria-label="close" @click="closeModal"></button>
            </header>
            <section class="modal-card-body">
              <div v-if="error" class="has-text-danger field">
                <span>{{error}}</span>
              </div>
              <div class="field">
                <label class="label" for="make-transfer-account-id">
                  To account ID
                </label>
                <input id="make-transfer-account-id" type="text" v-model="accountId" class="input" @keydown.enter="sendTransfer">
              </div>
              <div class="field">
                <label class="label" for="make-transfer-amount">
                  Amount ({{mainInfo.cryptocurrency.symbol}})
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
              <button class="button" @click="closeModal">Cancel</button>
            </footer>
          </div>
        </div>
      </div>
    `
  };
}

export default getComponent;
