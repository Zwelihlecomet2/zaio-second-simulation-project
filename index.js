class App {
    constructor(post){
        this.post  = [];
        this.currentUser = null;

        this.$mainContainer = document.querySelector(".main-container");
        this.$firebaseuiAuthContainer = document.querySelector("#firebaseui-auth-container");
        this.$logoutButton = document.querySelector("#logout-button");
        this.$uploadButton = document.querySelector("#uploadButton");
        this.$overlay = document.querySelector("#overlay");
        this.$uploadModal = document.querySelector("#uploadModal");
        this.$closeModal = document.querySelector("#closeModal");
        this.$uploadForm = document.querySelector("#uploadForm");

        // Initialize the FirebaseUI Widget using Firebase.
        this.ui = new firebaseui.auth.AuthUI(auth);

        this.handleAuth();
        this.addEventListeners();
    }

    addEventListeners(){
            this.$logoutButton.addEventListener("click", (event) =>{
                this.handleLogout(event);
            });

             // Show the modal and overlay when the "Upload" button is clicked
            this.$uploadButton.addEventListener("click", (event) =>{
                this.showUpModal(event);
            });

            this.$closeModal.addEventListener("click", (event) =>{
                this.closeModal(event);
            });

            this.$overlay.addEventListener("click", (event) =>{
                this.closeModal(event);
            });

            this.$uploadForm.addEventListener("submit", (event) =>{
                this.handleSubmission(event);
            });
    }

    async handleSubmission(event){
        event.preventDefault();

        let caption = document.querySelector("#postCaption").value;
        let postImage = document.querySelector("#postImage").files[0];
        if(!caption || !postImage){
            alert("Please provide both a caption and an image.");
            return;
        }
        try{
            // Show loading indicator or disable the button here if needed

            // Upload the image to Firebase Storage
            let storageRef = storage.ref(`posts/${this.currentUser.uid}/${postImage.name}`);
            let uploadTask = storageRef.put(postImage);

            await uploadTask;

            // Get the download URL of the uploaded image
            let downloadURL = await storageRef.getDownloadURL();

            //Save the Post data to Firestore
            await db.collection("posts").add({
                userId: this.currentUser.uid,
                caption: caption,
                imageURL: downloadURL,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert("Post Uploaded Succesfully");
            this.closeModal();
            this.$uploadForm.reset();
        }

        catch(error){
            console.log("Error Creating Post:", error);
            alert("An error occurred while creating the post. Please try again.");
        }
    }

    showUpModal(){
        this.$overlay.classList.remove("hidden");
        this.$uploadModal.classList.remove("hidden");
    }

    closeModal(){
        this.$overlay.classList.add("hidden");
        this.$uploadModal.classList.add("hidden");
    }

    handleAuth(){
        auth.onAuthStateChanged((user) => {
            if (user) {
              // User is signed in
                this.currentUser = user;
              // ...
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