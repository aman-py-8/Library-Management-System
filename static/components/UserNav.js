export default {
  name: 'UserNav',
  data() {
    return {
      searchQuery: '', // Data property to bind the search input
    };
  },
  methods: {
    search(event) {
      event.preventDefault(); // Prevent the default form submission

      if (this.searchQuery.trim()) {
        // Redirect to the search results page with the query parameter
        this.$router.push({ path: '/search-results', query: { query: this.searchQuery } });
      }
    },
    logout() {
      // Remove authentication token from local storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_role');

      // Redirect to login page or home page
      this.$router.push('/login');
    }
  },
  template: `
    <nav class="navbar navbar-expand-lg bg-body-tertiary">
      <div class="container-fluid">
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarTogglerDemo01" aria-controls="navbarTogglerDemo01" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarTogglerDemo01">
          
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <a class="nav-link active" aria-current="page" href="/#/userdash">Home</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="/#/my-books">My Books</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="/#/user-profile">Profile</a>
            </li>
          </ul>
          <form class="d-flex" role="search" @submit="search">
            <input class="form-control me-2" type="search" v-model="searchQuery" placeholder="Search" aria-label="Search">
            <button class="btn btn-outline-success" type="submit">Search</button>
          </form>
          <button class="btn btn-outline-danger ms-2" @click="logout">Logout</button>
        </div>
      </div>
    </nav>
  `,
};
