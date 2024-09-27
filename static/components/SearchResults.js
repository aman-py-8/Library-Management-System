export default {
    name: 'SearchResults',
    props: ['query'],
    data() {
      return {
        sections: [],
        ebooks: [],
        errorMessage: ''
      };
    },
    async created() {
      if (this.query) {
        await this.fetchResults();
      }
    },
    methods: {
      async fetchResults() {
        try {
          const response = await fetch(`http://127.0.0.1:5000/api/search?query=${encodeURIComponent(this.query)}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
  
          if (response.ok) {
            const data = await response.json();
            this.sections = data.sections || [];
            this.ebooks = data.ebooks || [];
          } else {
            const errorData = await response.json();
            this.errorMessage = errorData.message || 'Failed to fetch search results.';
          }
        } catch (error) {
          this.errorMessage = 'An error occurred while searching.';
          console.error('Error:', error);
        }
      }
    },
    template: `
      <div class="container mt-4">
        <h1>Search Results</h1>
        <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>
        <div v-if="sections.length">
          <h3>Sections</h3>
          <ul class="list-group">
            <li v-for="section in sections" :key="section.id" class="list-group-item">
              {{ section.name }}
            </li>
          </ul>
        </div>
        <div v-if="ebooks.length">
          <h3>E-books</h3>
          <ul class="list-group">
            <li v-for="ebook in ebooks" :key="ebook.id" class="list-group-item">
              {{ ebook.name }} by {{ ebook.author }}
            </li>
          </ul>
        </div>
      </div>
    `
  };
  