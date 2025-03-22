class App {
    constructor(post){
        this.post  = [];

        this.$mainContainer = document.querySelector(".main-container");
        this.$firebaseuiAuthContainer = document.querySelector("#firebaseui-auth-container");
        this.$logoutButton = document.querySelector("#logout-button");


        // Initialize the FirebaseUI Widget using Firebase.
        this.ui = new firebaseui.auth.AuthUI(auth);

        this.handleAuth();
        this.addEventListeners();
    }

    addEventListeners(){
        document.body.addEventListener("click", (event) =>{
            this.$logoutButton.addEventListener("click", (event) =>{
                this.handleLogout(event);
            });
        }); 
    }

    handleAuth(){
        auth.onAuthStateChanged((user) => {
            if (user) {
              // User is signed in
              this.uid = user.uid;
              // ...
              console.log(user);
              this.redirectToApp();
            } else {
              // User is signed out
              // ...
              this.redirectToAuth();
            }
          });
    }

    redirectToApp(){
        this.$mainContainer.style.display = "block";
        this.$firebaseuiAuthContainer.style.display = "none";
    }

    redirectToAuth(){
        this.$mainContainer.style.display = "none";
        this.$firebaseuiAuthContainer.style.display = "block";

        this.ui.start('#firebaseui-auth-container', {
            signInOptions: [
              firebase.auth.EmailAuthProvider.PROVIDER_ID,
              firebase.auth.GoogleAuthProvider.PROVIDER_ID,

            ],
            // Other config options...
          });
    }

    handleLogout(){
        auth.signOut().then(() => {
            // Sign-out successful.
            this.redirectToAuth();
          }).catch((error) => {
            // An error happened.
          });
    }
}

let app = new App();