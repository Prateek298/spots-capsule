const footer = document.querySelector('footer');
const user = User;

if(user.age && user.about) {
	footer.classList.add('footer1');
}
else if(user.age && !user.about) {
	footer.classList.add('footer2');
}
else if(!user.age && !user.about){
	footer.classList.add('footer3');
}