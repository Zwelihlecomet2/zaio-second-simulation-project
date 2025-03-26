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
        this.$postsContainer = document.querySelector("#postsContainer");

        // Initialize the FirebaseUI Widget using Firebase.
        this.ui = new firebaseui.auth.AuthUI(auth);

        this.fetchPosts();
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

    async fetchPosts() {
        let loadingIndicator = document.querySelector("#loadingIndicator");

        // Show loading indicator
        loadingIndicator.classList.remove("hidden");

        try {
            let postsSnapshot = await db.collection("posts").orderBy("timestamp", "desc").get(); // Sort posts by timestamp (newest first)

            if (postsSnapshot.empty) {
                // If no posts exist, show a message
                this.$postsContainer.innerHTML = "<p>No posts available yet.</p>";
            } else {
                // Clear existing posts
                this.$postsContainer.innerHTML = "";

                // Loop through each post and create a post element
                postsSnapshot.forEach((doc) => {
                    let postData = doc.data();
                    let postElement = this.createPostElement(postData); // Create a post element
                    this.$postsContainer.appendChild(postElement); // Add it to the DOM
                });
            }
        } 
        
        catch(error) {
            console.error("Error fetching posts:", error);
            alert("An error occurred while loading posts.");
        } 
        
        finally {
            // Hide loading indicator
            loadingIndicator.classList.add("hidden");
        }
    }

    createPostElement(postData) {
        // Create the structure of a single post
        let postDiv = document.createElement("div");
        postDiv.classList.add("post");

        postDiv.innerHTML = `
            <div class="header">
                <div class="profile-area">
                    <div class="post-pic">
                        <img alt="User's profile picture" src="${postData.profilePicture || 'assets/akhil.png'}" />
                    </div>
                    <span class="profile-name">${postData.userId}</span>
                </div>
            </div>
            <div class="body">
                <img alt="Post image" src="${postData.imageURL}" style="object-fit: cover;" />
            </div>
            <div class="footer">
                <span class="caption">
                    <span class="caption-text">${postData.caption}</span>
                </span>
            </div>
        `;

        return postDiv;
    }


    async handleSubmission(event){
        event.preventDefault();

        let caption = document.querySelector("#postCaption").value;
        let postImage = document.querySelector("#postImage").files[0];

        if(!caption || !postImage){
            alert("Please provide both a caption and an image.");
            return;
        }

        // Show the loading indicator
        let loadingIndicator = document.querySelector("#loadingIndicator");
        loadingIndicator.classList.remove("hidden");

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

        finally{
            // Hide the loading indicator (whether success or failure)
            loadingIndicator.classList.add("hidden");
        }

        this.fetchPosts();
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
              console.log(this.currentUser.displayName);
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