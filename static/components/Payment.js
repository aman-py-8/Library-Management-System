export default {
    name: 'Payment',
    data() {
        return {
            bookId: this.$route.query.bookId,
            successMessage: '',
            errorMessage: ''
        };
    },
    methods: {
        async processPayment() {
            try {
                // Simulate payment process
                await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate payment delay

                // On successful payment, trigger PDF download
                window.location.href = `/api/ebooks/${this.bookId}/download`;
                this.successMessage = 'Payment successful! Your download should start shortly.';
            } catch (error) {
                this.errorMessage = 'Payment failed. Please try again.';
                console.error('Error processing payment:', error);
            }
        }
    },
    created() {
        this.processPayment();
    },
    template: `
    <div class="container mt-5">
        <div class="text-center">
            <h1>Processing Payment</h1>
            <div v-if="successMessage" class="alert alert-success mt-4">
                <i class="bi bi-check-circle"></i> {{ successMessage }}
            </div>
            <div v-if="errorMessage" class="alert alert-danger mt-4">
                <i class="bi bi-x-circle"></i> {{ errorMessage }}
            </div>
            <div v-if="!successMessage && !errorMessage" class="mt-4">
                <p><i class="bi bi-hourglass-split"></i> Please wait while we process your payment...</p>
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        </div>
    </div>
    `,
    style: `
    .container {
        max-width: 600px;
    }
    .alert {
        display: inline-flex;
        align-items: center;
        font-size: 1.2rem;
    }
    .bi {
        margin-right: 0.5rem;
    }
    .spinner-border {
        width: 3rem;
        height: 3rem;
        margin-top: 1rem;
    }
    `
};
