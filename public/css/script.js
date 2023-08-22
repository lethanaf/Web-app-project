let searchForm=document.querySelector(".search-form");

document.querySelector("#search-btn").onclick=()=>{
    searchForm.classList.toggle('active');
    navbar.classList.remove('active');
    loginForm.classList.remove('active');
    shoppingCart.classList.remove('active');
}

let shoppingCart=document.querySelector(".shopping-cart");

document.querySelector("#cart-btn").onclick=()=>{
  searchForm.classList.remove('active');
  navbar.classList.remove('active');
  loginForm.classList.remove('active');
  
}

let loginForm=document.querySelector(".login-form");

document.querySelector("#login-btn").onclick=()=>{
    loginForm.classList.toggle('active');
    searchForm.classList.remove('active');
    navbar.classList.remove('active');
    shoppingCart.classList.remove('active');
}

let navbar=document.querySelector(".navbar");

document.querySelector("#menu-btn").onclick=()=>{
    navbar.classList.toggle('active');
    searchForm.classList.remove('active');
    shoppingCart.classList.remove('active');
    loginForm.classList.remove('active');
}

window.onscroll=()=>{  
    searchForm.classList.remove('active');
    navbar.classList.remove('active');
    loginForm.classList.remove('active');
    shoppingCart.classList.remove('active');

}


var swiper = new Swiper(".product-slider", {
    loop:true,
    spaceBetween: 20,
    autoplay:{
      delay: 7500,
      disableOnInteraction:false,  
    },
    centeredSlides:true, 
    breakpoints: {
      0: {
        slidesPerView: 1,
      },
      768: {
        slidesPerView: 2,
      },
      1020: {
        slidesPerView: 3,
      },
    },
  });

  var swiper = new Swiper(".review-slider", {
    loop:true,
    spaceBetween: 20,
    autoplay:{
      delay: 7500,
      disableOnInteraction:false,  
    },
    centeredSlides:true, 
    breakpoints: {
      0: {
        slidesPerView: 1,
      },
      768: {
        slidesPerView: 2,
      },
      1020: {
        slidesPerView: 3,
      },
    },
  });

  // const addToCartButtons=document.querySelectorAll(".addToCartBtn");

  // addToCartButtons.forEach(button=>{
  //   button.addEventListener("click",function(){
  //     const parentDiv={
  //      state: this.parentNode
  //     }
  //     const linktoimg="./"+parentDiv.state.firstElementChild.getAttribute("src");
  //     const itemClicked=parentDiv.state.firstElementChild.nextElementSibling.innerText;
  //   })
  // })

  




