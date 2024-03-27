function hexToRgb(hex)
{
	let r = 0, g = 0, b = 0;
	hex = hex.replace(/^#/, '');

	if (hex.length === 3)
	{
		r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
		g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
		b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
	}
	else if (hex.length === 6)
	{
		r = parseInt(hex.substring(0, 2), 16);
		g = parseInt(hex.substring(2, 4), 16);
		b = parseInt(hex.substring(4, 6), 16);
	}
	return { r, g, b };
}

function invertColor({ r, g, b })
{
	const rInv = 255 - r;
	const gInv = 255 - g;
	const bInv = 255 - b;
	return `#${toHex(rInv)}${toHex(gInv)}${toHex(bInv)}`;
}

function toHex(component)
{
	const hex = component.toString(16);
	return hex.length === 1 ? '0' + hex : hex;
}
