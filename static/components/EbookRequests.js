import Navbar from "./Navbar.js";

export default {
    name: 'EbookRequests',
    components: {
        Navbar
    },
    data() {
        return {
            requests: [],
            ebooks: {},
            users: {},
            grantedBooks: [],  // Data property for granted books
            errorMessage: '',
            successMessage: '' // Property for success messages
        };
    },
    methods: {
        async fetchRequests() {
            try {
                const response = await fetch('/api/ebook-requests');
                if (response.ok) {
                    const data = await response.json();
                    this.requests = data;
                    await this.fetchEbooksAndUsers(); // Fetch additional details
                    await this.fetchGrantedBooks(); // Fetch granted books
                } else {
                    this.errorMessage = 'Failed to fetch ebook requests.';
                }
            } catch (error) {
                console.error('Error:', error);
                this.errorMessage = 'An error occurred while fetching ebook requests.';
            }
        },
        async fetchEbooksAndUsers() {
            try {
                const ebookIds = [...new Set(this.requests.map(request => request.ebook_id))];
                const userIds = [...new Set(this.requests.map(request => request.user_id))];

                // Fetch ebook details
                const ebookResponses = await Promise.all(ebookIds.map(id => fetch(`/api/ebooks/${id}`)));
                const ebooks = await Promise.all(ebookResponses.map(response => response.json()));
                this.ebooks = ebooks.reduce((acc, ebook) => {
                    acc[ebook.id] = ebook;
                    return acc;
                }, {});

                // Fetch user details
                const userResponses = await Promise.all(userIds.map(id => fetch(`/api/users/${id}`)));
                const users = await Promise.all(userResponses.map(response => response.json()));
                this.users = users.reduce((acc, user) => {
                    acc[user.id] = user;
                    return acc;
                }, {});
            } catch (error) {
                console.error('Error fetching ebooks and users:', error);
                this.errorMessage = 'An error occurred while fetching ebook or user details.';
            }
        },
        async fetchGrantedBooks() {
            try {
                const response = await fetch('/api/all_granted_books', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('auth_token')}` // Include token if required
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    this.grantedBooks = data; // Assign the fetched data to grantedBooks
                } else {
                    const errorData = await response.json();
                    this.errorMessage = errorData.message || 'Failed to fetch granted books.';
                }
            } catch (error) {
                console.error('Error:', error);
                this.errorMessage = 'An error occurred while fetching granted books.';
            }
        },
        async grantRequest(requestId) {
            try {
                const response = await fetch(`/api/ebook-requests/${requestId}/grant`, {
                    method: 'POST',
                });
                if (response.ok) {
                    await this.fetchRequests(); // Refresh the requests list
                } else {
                    console.error('Failed to grant request');
                }
            } catch (error) {
                console.error('Error granting request:', error);
            }
        },
        async rejectRequest(requestId) {
            try {
                const response = await fetch(`/api/ebook-requests/${requestId}/reject`, {
                    method: 'DELETE',
                });
                if (response.ok) {
                    await this.fetchRequests(); // Refresh the requests list
                } else {
                    const errorData = await response.json();
                    this.errorMessage = errorData.message || 'Failed to reject request.';
                }
            } catch (error) {
                console.error('Error rejecting request:', error);
                this.errorMessage = 'An error occurred while rejecting request.';
            }
        },
        async revokeBook(bookId) {
            try {
                const response = await fetch(`/api/revoke-book/${bookId}`, {
                    method: 'POST', // Ensure this matches the method in your Flask route
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                    },
                });
                if (response.ok) {
                    await this.fetchGrantedBooks(); // Refresh the granted books list
                    this.successMessage = 'Access revoked successfully!';
                } else {
                    const errorData = await response.json();
                    this.errorMessage = errorData.message || 'Failed to revoke access.';
                }
            } catch (error) {
                console.error('Error revoking access:', error);
                this.errorMessage = 'An error occurred while revoking access.';
            }
        }
    },
    created() {
        this.fetchRequests(); // Fetch requests and granted books when the component is created
    },
    template: `
    <div>
        <Navbar />
        <div class='container mt-4'>
            <h2>Ebook Requests</h2>
            <p v-if="errorMessage" style="color: red;">{{ errorMessage }}</p>
            <p v-if="successMessage" style="color: green;">{{ successMessage }}</p>
            <div class="row">
                <div class="col-md-4" v-for="request in requests" :key="request.id">
                    <div class="card mb-4">
                        <div class="card-body">
                            <h5 class="card-title">{{ ebooks[request.ebook_id]?.name || 'Unknown Title' }}</h5>
                            <h6 class="card-subtitle mb-2 text-muted">{{ ebooks[request.ebook_id]?.authors || 'Unknown Author' }}</h6>
                            <p class="card-text">Requested by: {{ users[request.user_id]?.email || 'Unknown User' }}</p>
                            <button class="btn btn-success me-2" @click="grantRequest(request.id)">Grant</button>
                            <button class="btn btn-danger" @click="rejectRequest(request.id)">Reject</button>
                        </div>
                    </div>
                </div>
            </div>
            <h2 class='mt-5'>Granted Books</h2>
            <div class="row">
                <div class="col-md-4" v-for="book in grantedBooks" :key="book.id">
                    <div class="card mb-4">
                        <div class="card-body">
                            <h5 class="card-title">{{ book.ebook.name || 'Unknown Title' }}</h5>
                            <h6 class="card-subtitle mb-2 text-muted">{{ book.ebook.author || 'Unknown Author' }}</h6>
                            <p class="card-text">Granted to: {{ book.user.email || 'Unknown User' }}</p> <!-- Display user email -->
                            <button class="btn btn-danger" @click="revokeBook(book.id)">Revoke Access</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`
};
