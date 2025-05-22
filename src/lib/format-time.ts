export default function formatTime(sec: number | string | undefined | null) {
	if (!sec) {
		return '';
	}
	sec = Math.round(Number(sec));
	let m = Math.floor(sec / 60);
	let s = sec % 60;
	return `${m}:${s.toString().padStart(2, "0")}`;
}