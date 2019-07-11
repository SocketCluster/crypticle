
function getPageComponent(pageOptions) {
  let {socket} = pageOptions;

  return {
    props: {
      redirect: {
        type: String,
        default: null
      }
    },
    data: function () {
      return {
        error: null,
        accountId: '',
        password: ''
      };
    },
    methods: {
      login: async function () {
        var details = {
          accountId: this.accountId,
          password: this.password
        };
        try {
          await socket.invoke('login', details);
        } catch (error) {
          this.error = `Failed to login. ${error.message}`;
          return;
        }
        this.error = '';

        if (this.redirect != null) {
          window.location.href = decodeURIComponent(this.redirect);
        }
      }
    },
    template: `
      <div class="page-container container login-container">
        <h2 class="title is-2">Login</h2>
        <div v-if="error" class="field has-text-danger">
          <span>{{error}}</span>
        </div>
        <div class="field">
          <label class="label" for="login-form-account-id">
            Account ID
          </label>
          <input id="login-form-account-id" type="text" v-model="accountId" class="input" @keydown.enter="login">
        </div>
        <div class="field">
          <label class="label" for="login-form-password">
            Password
          </label>
          <input id="login-form-password" type="password" v-model="password" class="input" @keydown.enter="login">
        </div>
        <div class="field">
          <input type="button" class="button is-medium is-link" value="Login" @click="login">
        </div>
      </div>
    `
  };
}

export default getPageComponent;
