// Shim minimal pentru a satisface importul din @oceanprotocol/lib.
// Dacă vei folosi direct DDOManager în viitor, înlocuiește shim-ul
// cu un alias către un fișier real din node_modules/@oceanprotocol/ddo-js/dist/*.
export class DDOManager {}
export default DDOManager;
