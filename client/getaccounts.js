// const transactions = require('@liskhq/lisk-transactions');
// const cryptography = require('@liskhq/lisk-cryptography');
const { APIClient } = require('@liskhq/lisk-api-client');
// const { Mnemonic } = require('@liskhq/lisk-passphrase');

const api = new APIClient(['http://localhost:4000']);

const getAccounts = async () => {
    let offset = 8;
    let accounts = [];
    const accountsArray = [];

    do {
        const retrievedAccounts = await api.accounts.get({ limit: 100, offset });
        accounts = retrievedAccounts.data;
        accountsArray.push(...accounts);
        if (accounts.length === 100) {
            offset += 100;
        }
    } while (accounts.length === 100);
  
    console.log(accountsArray);
}

const getMyAccounts = async () => {
    let offset = 0;
    let accounts = [];
    const accountsArray = [];

    do {
        const retrievedAccounts = await api.accounts.get({ limit: 100, offset });
        accounts = retrievedAccounts.data;
        accountsArray.push(...accounts);
        if (accounts.length === 100) {
            offset += 100;
        }
    } while (accounts.length === 100);

    let assetAccounts = [];
    for (var i = 0; i < accountsArray.length; i++) {
        let accountAsset = accountsArray[i].asset;
        if (accountAsset && Object.keys(accountAsset).length > 0){
            assetAccounts.push(accountsArray[i]);
        }
    }
  
    console.log(assetAccounts);
}

//getMyAccounts();
//getAccounts();
const getAccount = async (address) => {
    const { data: accounts } = await api.accounts.get({ address: address });
    console.log(accounts);
};

const getProductInfo = async (address) => {
    const { data: accounts } = await api.accounts.get({ address: address });
    console.log(accounts[0].asset);
};

getAccount("9000837102371535794L"); // market
getAccount("1853159333580129910L"); // producer
getAccount("16537225521900431256L"); // carrier
getAccount("5960010569878593296L"); // product
getAccount("11210466091132267990L"); // pallet
getProductInfo("5960010569878593296L"); // product
