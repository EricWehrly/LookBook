export default function getUUID() {
    if(crypto.randomUUID) {
        return crypto.randomUUID()
    } else {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
            var cryptoArray = new Uint8Array(1);
            crypto.getRandomValues(cryptoArray);
            var r = cryptoArray[0] & 0x0F;
            var v = c === "x" ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}
