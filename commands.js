function executeColor(colorCode) {
	if (/^#?([0-9A-F]{3}){1,2}$/i.test(colorCode))
	{
		const validColorCode = colorCode.startsWith('#') ? colorCode : '#' + colorCode;
		document.documentElement.style.setProperty('--background-color', validColorCode);

		const rgb = hexToRgb(validColorCode);
		const invertedColor = invertColor(rgb);
		document.documentElement.style.setProperty('--text-color', invertedColor);

		return 0;
	} else
		return -1;
}

function executeFont(font)
{
	switch (font)
	{
		case "mono":
			document.documentElement.style.setProperty('--font-family', "'Courier New', Courier, monospace");
			break;
		case "serif":
			document.documentElement.style.setProperty('--font-family', "'Times New Roman', Times, serif");
			break;
		case "sans":
			document.documentElement.style.setProperty('--font-family', "'Arial', sans-serif");
			break;
		case "funky":
			document.documentElement.style.setProperty('--font-family', "'Comic Sans MS', cursive");
			break;
		default:
			return -1;
	}
	return 0;
}

function executeCd(cd)
{
	switch (cd.toLowerCase())
	{
		case "cv":
			window.open('https://frederickschubert.de/curriculumvitae.html', '_blank');
			break;
		case "github":
			window.open('https://github.com/FreddyMSchubert', '_blank');
			break;
		case "linkedin":
			window.open('https://www.linkedin.com/in/frederick-m-schubert/', '_blank');
			break;
		default:
			return -1;
	}
	return 0;
}
