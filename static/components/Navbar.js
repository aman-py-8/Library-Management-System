export default {
  name: 'UserNav',
  data() {
    return {
      searchQuery: '',
      searchResults: {
        sections: [],
        ebooks: []
      },
      errorMessage: ''
    };
  },
  methods: {
    async search() {
      try {
        const response = await fetch(`http://127.0.0.1:5000/api/search?query=${encodeURIComponent(this.searchQuery)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          this.searchResults = data;
          // Redirect to the search results page with query
          this.$router.push({ path: '/search-results', query: { query: this.searchQuery } });
        } else {
          const errorData = await response.json();
          this.errorMessage = errorData.message || 'Failed to fetch search results.';
        }
      } catch (error) {
        this.errorMessage = 'An error occurred while searching.';
        console.error('Error:', error);
      }
    },
    logout() {
      // Remove authentication token from local storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_role');

      // Redirect to login page
      this.$router.push('/login');
    }
  },
  template: `
    <nav class="navbar fixed-top navbar-expand-lg bg-body-tertiary">
      <div class="container-fluid">
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarTogglerDemo01" aria-controls="navbarTogglerDemo01" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarTogglerDemo01">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <a class="nav-link active" aria-current="page" href="/#/libdash">Home</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="/#/ebook-requests">Ebook Requests</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="/#/libstats">Stats</a>
            </li>
          </ul>
          <form class="d-flex" role="search" @submit.prevent="search">
            <input class="form-control me-2" type="search" v-model="searchQuery" placeholder="Search" aria-label="Search">
            <button class="btn btn-outline-success" type="submit">Search</button>
          </form>
          <button class="btn btn-outline-danger ms-2" @click="logout">Logout</button>
        </div>
      </div>
    </nav>
  `,
};
