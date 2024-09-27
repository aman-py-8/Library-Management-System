import UserNav from "./UserNav.js";
export default {
    name: 'ViewBook',
    components: { 
        UserNav
    },
    data() {
        return {
            book: null,
            errorMessage: ''
        };
    },
    methods: {
        async fetchBook() {
            const bookId = this.$route.params.id;
            console.log('Fetching book with ID:', bookId);
            try {
                const response = await fetch(`/api/ebooks/${bookId}`);
                if (!response.ok) throw new Error('Failed to fetch book details');
                this.book = await response.json();
                console.log('Fetched book:', this.book);
            } catch (error) {
                this.errorMessage = error.message;
                console.error('Error fetching book:', error);
            }
        },
        downloadBook() {
            // Redirect to payment page with book ID
            this.$router.push({ path: '/payment', query: { bookId: this.book.id } });
        }
    },
    created() {
        this.fetchBook();
    },
    template: `
    <div> <UserNav />
    <div class="container my-4">
        <div v-if="book" class="card">
            <div class="card-header bg-primary text-white">
                <h2 class="mb-0">{{ book.name }} <button v-if="book" class="btn btn-warning" @click="downloadBook">Download this book for $10</button></h2>
                
            </div>
            <div class="card-body">
                <h5 class="card-title">Authors:</h5>
                <p class="card-text">{{ book.authors }}</p>
                <h5 class="card-title">Content:</h5>
                <p class="card-text">{{ book.content }}</p>
                
            </div>
        </div>
        <div v-if="errorMessage" class="alert alert-danger mt-3">
            {{ errorMessage }}
        </div>
    </div>
    </div>
    `,
};
