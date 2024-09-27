export default {
  name: 'Home',
  template: `
    <div style="
      background-image: url('/static/img.jpg'); 
      height: 100vh; 
      background-size: cover; 
      background-position: center; 
      display: flex; 
      justify-content: center; 
      align-items: center; 
      color: white;
    ">
      <div style="
        text-align: center; 
        background: rgba(0, 0, 0, 0.5); 
        padding: 20px; 
        border-radius: 10px;
      ">
        <h1>Welcome to the Library Management System</h1>
        <div>
          <button class="btn btn-primary mt-2" @click="goToLogin">Login</button>
          <button class="btn btn-secondary mt-2" @click="goToRegister">Register</button>
        </div>
      </div>
    </div>
  `,
  methods: {
    goToLogin() {
      this.$router.push('/login');
    },
    goToRegister() {
      this.$router.push('/register');
    }
  }
};
