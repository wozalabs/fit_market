const transactions = require('@liskhq/lisk-transactions');
const cryptography = require('@liskhq/lisk-cryptography');
const { APIClient } = require('@liskhq/lisk-api-client');
const { Mnemonic } = require('@liskhq/lisk-passphrase');
const accounts = require('../client/accounts.json');
const RegisterMarketTransaction = require('../transactions/register-market');
const RegisterProducerTransaction = require('../transactions/register-producer');
const RegisterProductTransaction = require('../transactions/register-product');
const RegisterPalletTransaction = require('../transactions/register-pallet');
const StartTransportTransaction = require('../transactions/start-transport');
const FinishTransportTransaction = require('../transactions/finish-transport');
const UpdateProductTransaction = require('../transactions/update-product');

const networkIdentifier = cryptography.getNetworkIdentifier(
    "23ce0366ef0a14a91e5fd4b1591fc880ffbef9d988ff8bebf8f3666b0c09597d",
    "Lisk",
);


const api = new APIClient(['http://localhost:4000']);


/* Utils */
const dateToLiskEpochTimestamp = date => (
    Math.floor(new Date(date).getTime() / 1000) - Math.floor(new Date(Date.UTC(2016, 4, 24, 17, 0, 0, 0)).getTime() / 1000)
);


const delay = ms => new Promise(res => setTimeout(res, ms));


const getNewCredentials = () => {
    const passphrase = Mnemonic.generateMnemonic();
    const keys = cryptography.getPrivateAndPublicKeyFromPassphrase(
        passphrase
    );
    const credentials = {
        address: cryptography.getAddressFromPublicKey(keys.publicKey),
        passphrase: passphrase,
        publicKey: keys.publicKey,
        privateKey: keys.privateKey
    };
    return credentials;
};


const initializeAccount = (account, amount, signerPassphrase) => {

    let tx = new transactions.TransferTransaction({
        asset: {
            amount: transactions.utils.convertLSKToBeddows(amount),
            recipientId: account.address,
        },
        networkIdentifier: networkIdentifier
    });
    
    tx.sign(signerPassphrase);
    
    api.transactions.broadcast(tx.toJSON()).then(res => {
        console.log("++++++++++++++++ API Response +++++++++++++++++");
        console.log(res.data);
        console.log("++++++++++++++++ Credentials +++++++++++++++++");
        console.dir(account);
        console.log("++++++++++++++++ Transaction Payload +++++++++++++++++");
        console.log(tx.stringify());
        console.log("++++++++++++++++ End Script +++++++++++++++++");
    }).catch(err => {
        console.log(JSON.stringify(err.errors, null, 2));
    });
};


const registerMarket = (account, signerPassphrase) => {

    const registerMarketTransaction = new RegisterMarketTransaction({
        asset: {
            marketId: account.address,
            name: account.name,
            latitude: account.latitude,
            longitude: account.longitude
        },
        networkIdentifier: networkIdentifier,
        timestamp: dateToLiskEpochTimestamp(new Date()),
    });
    
    registerMarketTransaction.sign(signerPassphrase);
    
    api.transactions.broadcast(registerMarketTransaction.toJSON()).then(res => {
        console.log("++++++++++++++++ API Response +++++++++++++++++");
        console.log(res.data);
        console.log("++++++++++++++++ Transaction Payload +++++++++++++++++");
        console.log(registerMarketTransaction.stringify());
        console.log("++++++++++++++++ End Script +++++++++++++++++");
    }).catch(err => {
        console.log(JSON.stringify(err.errors, null, 2));
    });
};


const registerProducer = (account, signerPassphrase) => {

    const registerProducerTransaction = new RegisterProducerTransaction({
        asset: {
            producerId: account.address,
            name: account.name,
            latitude: account.latitude,
            longitude: account.longitude
        },
        networkIdentifier: networkIdentifier,
        timestamp: dateToLiskEpochTimestamp(new Date()),
    });
    
    registerProducerTransaction.sign(signerPassphrase);
    
    api.transactions.broadcast(registerProducerTransaction.toJSON()).then(res => {
        console.log("++++++++++++++++ API Response +++++++++++++++++");
        console.log(res.data);
        console.log("++++++++++++++++ Transaction Payload +++++++++++++++++");
        console.log(registerProducerTransaction.stringify());
        console.log("++++++++++++++++ End Script +++++++++++++++++");
    }).catch(err => {
        console.log(JSON.stringify(err.errors, null, 2));
    });
};


const registerProduct = (account, signerPassphrase) => {

    const registerProductTransaction = new RegisterProductTransaction({
        asset: {
            productId: account.address,
            barcode: account.barcode,
            batch: account.batch,
            name: account.name,
            produced_quantity: account.produced_quantity,
            produced_date: account.produced_date,
            due_date: account.due_date
        },
        networkIdentifier: networkIdentifier,
        timestamp: dateToLiskEpochTimestamp(new Date()),
    });
    
    registerProductTransaction.sign(signerPassphrase);
    
    api.transactions.broadcast(registerProductTransaction.toJSON()).then(res => {
        console.log("++++++++++++++++ API Response +++++++++++++++++");
        console.log(res.data);
        console.log("++++++++++++++++ Transaction Payload +++++++++++++++++");
        console.log(registerProductTransaction.stringify());
        console.log("++++++++++++++++ End Script +++++++++++++++++");
    }).catch(err => {
        console.log(JSON.stringify(err.errors, null, 2));
    });
};


const registerPallet = (account, recipientId, postage, security, productId, product_quantity, signerPassphrase) => {

    const registerPalletTransaction = new RegisterPalletTransaction({
        asset: {
            palletId: account.address,
            recipientId: recipientId,
            postage: transactions.utils.convertLSKToBeddows(postage),
            security: transactions.utils.convertLSKToBeddows(security),
            productId: productId,
            product_quantity: product_quantity
        },
        networkIdentifier: networkIdentifier,
        timestamp: dateToLiskEpochTimestamp(new Date()),
    });
    
    registerPalletTransaction.sign(signerPassphrase);
    
    api.transactions.broadcast(registerPalletTransaction.toJSON()).then(res => {
        console.log("++++++++++++++++ API Response +++++++++++++++++");
        console.log(res.data);
        console.log("++++++++++++++++ Transaction Payload +++++++++++++++++");
        console.log(registerPalletTransaction.stringify());
        console.log("++++++++++++++++ End Script +++++++++++++++++");
    }).catch(err => {
        console.log(JSON.stringify(err.errors, null, 2));
    });
};


const startTransport = (palletId, signerPassphrase) => {

    const startTransportTransaction = new StartTransportTransaction({
        asset: {
            palletId: palletId
        },
        networkIdentifier: networkIdentifier,
        timestamp: dateToLiskEpochTimestamp(new Date()),
    });
    
    startTransportTransaction.sign(signerPassphrase);
    
    api.transactions.broadcast(startTransportTransaction.toJSON()).then(res => {
        console.log("++++++++++++++++ API Response +++++++++++++++++");
        console.log(res.data);
        console.log("++++++++++++++++ Transaction Payload +++++++++++++++++");
        console.log(startTransportTransaction.stringify());
        console.log("++++++++++++++++ End Script +++++++++++++++++");
    }).catch(err => {
        console.log(JSON.stringify(err.errors, null, 2));
    });
};


const finishTransport = (palletId, status, signerPassphrase) => {

    const finishTransportTransaction = new FinishTransportTransaction({
        asset: {
            palletId: palletId,
            status: status
        },
        networkIdentifier: networkIdentifier,
        timestamp: dateToLiskEpochTimestamp(new Date()),
    });
    
    finishTransportTransaction.sign(signerPassphrase);
    
    api.transactions.broadcast(finishTransportTransaction.toJSON()).then(res => {
        console.log("++++++++++++++++ API Response +++++++++++++++++");
        console.log(res.data);
        console.log("++++++++++++++++ Transaction Payload +++++++++++++++++");
        console.log(finishTransportTransaction.stringify());
        console.log("++++++++++++++++ End Script +++++++++++++++++");
    }).catch(err => {
        console.log(JSON.stringify(err.errors, null, 2));
    });
};


const updateProduct = (productId, organic, noTACC, transFat, daily_units, signerPassphrase) => {

    const updateProductTransaction = new UpdateProductTransaction({
        asset: {
            productId: productId,
            organic: organic,
            noTACC: noTACC,
            transFat: transFat,
            daily_units: daily_units
        },
        networkIdentifier: networkIdentifier,
        timestamp: dateToLiskEpochTimestamp(new Date()),
    });
    
    updateProductTransaction.sign(signerPassphrase);
    
    api.transactions.broadcast(updateProductTransaction.toJSON()).then(res => {
        console.log("++++++++++++++++ API Response +++++++++++++++++");
        console.log(res.data);
        console.log("++++++++++++++++ Transaction Payload +++++++++++++++++");
        console.log(updateProductTransaction.stringify());
        console.log("++++++++++++++++ End Script +++++++++++++++++");
    }).catch(err => {
        console.log(JSON.stringify(err.errors, null, 2));
    });
};


const initializeTest = async () => {
    // Genesis account with address: 11237980039345381032L
    initializeAccount(accounts.fitmarket, '1000', accounts.genesis.passphrase);
    initializeAccount(accounts.producer, '1000', accounts.genesis.passphrase);
    initializeAccount(accounts.carrier, '1000', accounts.genesis.passphrase);
    await delay(10000); // So that market and producer accounts are initialized
    registerMarket(accounts.fitmarket, accounts.genesis.passphrase);
    registerProducer(accounts.producer, accounts.genesis.passphrase);
    await delay(10000);
    initializeAccount(accounts.product, '1', accounts.producer.passphrase);
    await delay(10000);
    registerProduct(accounts.product, accounts.genesis.passphrase);
    initializeAccount(accounts.pallet, '1', accounts.producer.passphrase);
    await delay(10000);
    registerPallet(accounts.pallet, accounts.fitmarket.address, '500', '250', accounts.product.address, 10000, accounts.producer.passphrase);
    await delay(10000);
    startTransport(accounts.pallet.address, accounts.carrier.passphrase);
    await delay(10000);
    finishTransport(accounts.pallet.address, 'success', accounts.fitmarket.passphrase);
    await delay(10000);
    updateProduct(accounts.product.address, 'true', 'true', 'false', 0.4, accounts.fitmarket.passphrase);
};


initializeTest();
