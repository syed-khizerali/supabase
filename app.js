const SUPABASE_URL = "https://okuljwiwxbfbvjfthsnd.supabase.co";
const SUPABASE_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rdWxqd2l3eGJmYnZqZnRoc25kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NjY0MDUsImV4cCI6MjA3MTU0MjQwNX0.H8Xlnz9jiUKFElpkyuXxIoIoRMOqeXgt5wxb93VSFE8";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_API_KEY);
//console.log(supabase);


const userFeed = document.getElementById("user-feed");
const postBtn = document.getElementById("addPost");
const userInput = document.getElementById("userinput");
const signUpBtn = document.getElementById("signup");
const loginBtn = document.getElementById("login");
const logoutBtn = document.getElementById("logout-button");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password")
const postContainer = document.getElementById("container-content");
const formContainer = document.getElementById("form-container");

const imageInput = document.getElementById("file");
const imagePreview = document.getElementById("img-preview")
const imgAddBtn = document.getElementById("img-add-btn")

let selectedImage = [];


imageInput.addEventListener("change", async (e) => {

    const imageFile = e.target.files[0];

    if (selectedImage) {

        selectedImage = imageFile;
        console.log(selectedImage);
        

        imagePreview.innerHTML = "";

        const image = document.createElement("img");
        image.className = "object-cover w-full h-full"
        image.src = URL.createObjectURL(selectedImage)

        imagePreview.classList.remove("hidden")
        imgAddBtn.classList.add("hidden")



        imagePreview.appendChild(image)


    }

})

signUpBtn.addEventListener("click", async () => {

    const { data, error } = await supabase.auth.signUp({
        email: emailInput.value,
        password: passwordInput.value,
    });

    if (error) {
        alert(error.message)
    } else {
        alert("Successfully signup please check your email");
        console.log(data);
        emailInput.value = "";
        passwordInput.value = ""
    }
})

loginBtn.addEventListener("click", async () => {

    const { data, error } = await supabase.auth.signInWithPassword({
        email: emailInput.value,
        password: passwordInput.value,
    });

    if (error) {
        alert(error.message)
    } else {
        alert("Successfully logged in");
        showPost()
    }


});

logoutBtn.addEventListener("click", async () => {
    await supabase.auth.signOut();

    formContainer.style.display = "block";
    postContainer.style.display = "none";

    if (logoutBtn) logoutBtn.classList.add("hidden");
    alert("Successfully logged out")

});

async function showPost() {

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        console.log("Please login first");
        formContainer.style.display = "block";
        postContainer.style.display = "none";
        return;
    }

    formContainer.style.display = "none";
    postContainer.style.display = "block";
    if (logoutBtn) logoutBtn.classList.remove("hidden");

    loadPost()

}

async function loadPost() {

    const { data: { user } } = await supabase.auth.getUser();
    console.log("User =>", user);



    if (!user) {
        alert("Please login first");
        return
    }

    userFeed.innerHTML = "";

    const { data, error } = await supabase
        .from("posting")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });


    if (error) {
        alert(error.message)
    }

    data.forEach((post) => {


        const postCard = document.createElement("div")
        postCard.className = "post-card border border-1 border-gray-300 rounded-md";

        const imageSect = document.createElement("div");
        imageSect.className = "img-name-sect flex items-center gap-3"

        imageSect.innerHTML = `
                                        <img src="./images/profile-pic/user.png" alt="">
                                <div class="name">
                                    <p>Anonymus</p>
                                </div>
        `;

        const content = document.createElement("div")
        content.className = "content";
        content.innerHTML = `

        <p>${post.content}</p>
        `;

        const postImgSect = document.createElement("div")
        postImgSect.className = "w-full border border-gray-300 post-image rounded-md"

        const postImage = document.createElement("img")
        postImage.className = "w-full h-65 object-cover"
        postImage.src = post.image_url;


        const button = document.createElement("div")
        button.className = "buttons-card flex items-center justify-end gap-3";

        const btnFlex = document.createElement("div")
        btnFlex.className = "flex items-center gap-1";

        const heartBtn = document.createElement("i")
        heartBtn.className = "fa-regular fa-heart text-[20px]";

        const delBtn = document.createElement("i")
        delBtn.className = "fa-solid fa-trash text-[20px] cursor-pointer";

        delBtn.onclick = async () => {
            const { error } = await supabase
                .from("posting")
                .delete()
                .eq("id", post.id)

            if (error) {
                alert("Some error while deleting the post")
            } else {
                postCard.remove()
                alert("Successfully deleted your post")
            }
        }



        userFeed.appendChild(postCard)
        postCard.appendChild(imageSect)
        postCard.appendChild(content)
        postCard.appendChild(postImgSect)
        postImgSect.appendChild(postImage)
        button.appendChild(btnFlex)
        button.appendChild(delBtn)
        btnFlex.appendChild(heartBtn)
        postCard.appendChild(button);

    })
}

postBtn.addEventListener("click", async () => {

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        alert("Must login first!")
        return
    }

    if (userInput.value == "") {
        alert("Please write something!");

        return;
    }

    let imageUrl = null;


    try {

        if(selectedImage) {
            const fileName = `${user.id}_${Date.now()}_${selectedImage.name}`
            const {error} = await supabase.storage
            .from("app-images")
            .upload(fileName, selectedImage)

            if(error) {
                alert(error.message)
                return;
            }

            const {data : urlData} = supabase.storage
            .from("app-images")
            .getPublicUrl(fileName)

            imageUrl = urlData.publicUrl

        }

        const { data } = await supabase.from("posting")
            .insert([
                {
                    content: userInput.value.trim(),
                    user_id: user.id,
                    image_url: imageUrl,
                }
            ]);


        alert("Your post is successfully posted");
        loadPost()

    }
    catch (error) {
        if (error) alert(error.message)
    }

    finally {
        userInput.value = "";
        imagePreview.classList.add("hidden")
        imgAddBtn.classList.remove("hidden")
    }
});

(async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        if (logoutBtn) logoutBtn.classList.remove("hidden");
        showPost()
    } else {
        if (logoutBtn) logoutBtn.classList.add("hidden")
    }

})();
