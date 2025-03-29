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
                optionsModal.classList.add("hidden");
            });

            this.$uploadForm.addEventListener("submit", (event) =>{
                this.handleSubmission(event);
            });
    }
    
    updatePostInDOM(postId, updatedData) {
        // Find the post element by its ID
        const postElement = document.getElementById(postId);
        if (!postElement) {
            console.error("Post element not found in DOM for ID:", postId);
            return;
        }
    
        // Update the caption
        const captionElement = postElement.querySelector(".caption-text");
        if (captionElement) {
            captionElement.textContent = updatedData.caption;
        }
    
        // Update the image if a new image URL is provided
        if (updatedData.imageURL) {
            const imageElement = postElement.querySelector(".body img");
            if (imageElement) {
                imageElement.src = updatedData.imageURL;
            }
        }
    }

    async editPost(postId) {
        try {
            // Check if the user is authenticated
            if (!auth.currentUser) {
                alert("You must be logged in to edit a post.");
                return;
            }
    
            // Fetch the post data from Firestore
            const postDoc = await db.collection("posts").doc(postId).get();
    
            // Check if the post exists
            if (!postDoc.exists) {
                console.error("Post not found for ID:", postId);
                alert("The post you are trying to edit does not exist.");
                return;
            }
    
            // Get the post data
            const postData = postDoc.data();
    
            // Check if the post data is valid
            if (!postData || !postData.caption || !postData.imageURL) {
                console.error("Post data is missing or invalid:", postData);
                alert("The post data is missing or invalid.");
                return;
            }
    
            // Open the upload modal with pre-filled data
            document.getElementById("postCaption").value = postData.caption;
            document.getElementById("existingImage").src = postData.imageURL; // Display the existing image
            this.showUpModal();
    
            // Temporarily store the Firestore document ID
            let currentPostId = postId;
    
            // Override the form submission to update the post instead of creating a new one
            this.$uploadForm.onsubmit = async (event) => {
                event.preventDefault();
                const newCaption = document.getElementById("postCaption").value;
                const newImageFile = document.getElementById("postImage").files[0];
    
                // Prepare the updated data
                let updatedData = { caption: newCaption };
    
                // If a new image is uploaded, update it in Firebase Storage
                if (newImageFile) {
                    let storageRef = storage.ref(`posts/${this.currentUser.uid}/${newImageFile.name}`);
                    let uploadTask = storageRef.put(newImageFile);
                    await uploadTask;
                    let newImageURL = await storageRef.getDownloadURL();
                    updatedData.imageURL = newImageURL; // Add the new image URL to the update
                }
    
                // Update the post in Firestore
                await db.collection("posts").doc(currentPostId).update(updatedData);
    
                // Dynamically update the post in the DOM
                this.updatePostInDOM(currentPostId, updatedData);
    
                alert("Post updated successfully!");
                this.closeModal();
            };
        } catch (error) {
            console.error("Error editing post:", error);
            alert("An error occurred while editing the post. Please try again.");
        }
    }


    showOptionsModal(postId, postUserId){
        let optionsModal = document.querySelector("#optionsModal");
        let optionsList = document.querySelector("#optionsList");
    
        // Clear existing options
        optionsList.innerHTML = "";
    
        // Check if the user is authenticated
        if(!auth.currentUser){
            alert("You must be logged in to view options.");
            return;
        }
    
        // Check if the post belongs to the current user
        if(auth.currentUser.uid === postUserId) {
            // Add "Edit" and "Delete" options in red
            let editOption = document.createElement("li");
            editOption.textContent = "Edit";
            editOption.classList.add("red");

            editOption.addEventListener("click", () =>{
                this.editPost(postId);
                this.closeOptionsModal();
            });
            optionsList.appendChild(editOption);
    
            let deleteOption = document.createElement("li");
            deleteOption.textContent = "Delete";
            deleteOption.classList.add("red");
            deleteOption.addEventListener("click", () => this.deletePost(postId));
            optionsList.appendChild(deleteOption);
        }
    
        // Add default Instagram-like options in black
        let defaultOptions = ["Report", "Unfollow", "Go to post", "Share to...", "Copy link"];
        defaultOptions.forEach((optionText) => {
            let option = document.createElement("li");
            option.textContent = optionText;
            optionsList.appendChild(option);
        });
    
        // Position the modal near the clicked button
        let moreButtonRect = event.target.getBoundingClientRect();
        optionsModal.style.top = `${moreButtonRect.bottom + window.scrollY}px`;
        optionsModal.style.left = `${moreButtonRect.right + window.scrollX - 200}px`;
    
        // Show the modal
        optionsModal.classList.remove("hidden");
    }

    closeOptionsModal(){
        optionsModal.classList.add("hidden");
    }

    async fetchPosts() {
        let loadingIndicator = document.querySelector("#loadingIndicator");

        // Show loading indicator
        loadingIndicator.classList.remove("hidden");

        try {
            let postsSnapshot = await db
            .collection("posts")
            .orderBy("timestamp", "desc")
            .get();
            
            
            if (postsSnapshot.empty) {
                // If no posts exist, show a message
                this.$postsContainer.innerHTML = "<p>No posts available yet.</p>";
            } else {
                // Clear existing posts
                this.$postsContainer.innerHTML = "";

                // Loop through each post and create a post element
                postsSnapshot.forEach((doc) => {
                    let postData = doc.data();
                    postData.id = doc.id; // Assign the Firestore document ID
                    console.log("Fetched Post Data:", postData); // Log the fetched data
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
        postDiv.id = postData.id; // Assign Firestore document ID to the post

        postDiv.innerHTML = `
            <div class="header">
                <div class="profile-area">
                    <div class="post-pic">
                        <img alt="User's profile picture" src="${postData.profilePicture || 'assets/akhil.png'}" />
                    </div>
                    <div class="post-info">
                        <span class="profile-name">${postData.userId}</span>
                        <span class="more-button"><button>More</button></span>
                    </div>
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

            // Attach an event listener to the "More" button
            let moreButton = postDiv.querySelector(".more-button button");
            moreButton.addEventListener("click", () => {
            this.showOptionsModal(postData.id, postData.userId); // Pass post ID and user ID
            this.$overlay.classList.remove("hidden");
    });

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
            location.reload();
        }

        catch(error){
            console.log("Error Creating Post:", error);
            alert("An error occurred while creating the post. Please try again.");
        }

        finally{
            // Hide the loading indicator (whether success or failure)
            loadingIndicator.classList.add("hidden");
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
        auth.onAuthStateChanged( async (user) => {
            if(user) {
              // User is signed in
                this.currentUser = user;
              // ...
              this.redirectToApp();

            await this.fetchPosts();

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