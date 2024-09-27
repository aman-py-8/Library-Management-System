import router from './router.js';


new Vue({
    el: '#app',
    template: `<div>
        
        <router-view />
        </div>`,
    router,

});
