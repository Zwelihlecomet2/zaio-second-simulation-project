class App {
    constructor(post){
        this.post  = [];

        this.$mainContainer = document.querySelector(".main-container");
        this.$firebaseuiAuthContainer = document.querySelector("#firebaseui-auth-container");
        this.$logoutButton = document.querySelector("#logout-button");
        this.$uploadButton = document.querySelector("#uploadButton");
        this.$overlay = document.querySelector("#overlay");
        this.$uploadModal = document.querySelector("#uploadModal");
        this.$closeModal = document.querySelector("#closeModal");

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

            // document.addEventListener("DOMContentLoaded", (event) =>{

            // });

             // Show the modal and overlay when the "Upload" button is clicked
            uploadButton.addEventListener("click", (event) =>{
                this.handleUploadModal(event);
                console.log(event);
            });
        }); 
    }

    handleUploadModal(){
        if(this.$overlay.classList.contains("hidden") && this.$uploadModal.classList.contains("hidden")){
            this.$overlay.classList.remove("hidden");
            this.$uploadModal.classList.remove("hidden");
        }

        else{
            this.$overlay.classList.add("hidden");
            this.$uploadModal.classList.add("hidden"); 
        }
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