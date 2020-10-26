const caraImg = document.getElementById('caraImg');
const showPic = document.querySelector("#showCard > img");

caraImg.addEventListener('click', function() {
	const reqPicSrc = this.getAttribute('src');
	showPic.setAttribute('src', reqPicSrc);
});