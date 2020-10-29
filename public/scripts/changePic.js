const caraImg = document.querySelectorAll(".carousel-item img");
const showPic = document.querySelector("#showCard > img");

for(let i = 0; i < caraImg.length; i++) {
	caraImg[i].addEventListener('click', function() {
		let reqPicSrc = this.getAttribute('src');
		showPic.setAttribute('src', reqPicSrc);
	});
}
