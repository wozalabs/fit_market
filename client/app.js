const express = require('express');
const bodyParser = require('body-parser');
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

// Constants
const API_BASEURL = 'http://localhost:4000';
const PORT = 3000;

// Initialize
const app = express();
const api = new APIClient([API_BASEURL]);

app.locals.payload = {
    tx: null,
    res: null,
};

// Configure Express
app.set('view engine', 'pug');
app.use(express.static('public'));

// parse application/json
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/* Utils */
const dateToLiskEpochTimestamp = date => (
    Math.floor(new Date(date).getTime() / 1000) - Math.floor(new Date(Date.UTC(2016, 4, 24, 17, 0, 0, 0)).getTime() / 1000)
);

const getAccounts = async () => {
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

    let relevantAccounts = [];
    for (var i = 0; i < accountsArray.length; i++) {
        let accountAsset = accountsArray[i].asset;
        if (accountsArray[i].balance > 0 || (accountAsset && Object.keys(accountAsset).length > 0)){
            relevantAccounts.push(accountsArray[i]);
        }
    }

    return relevantAccounts;
}

/* Routes */
app.get('/', (req, res) => {
    res.render('index');
});

/**
 * Request relevant accounts
 */
app.get('/accounts', async(req, res) => {
    const relevantAccounts = await getAccounts();
    res.render('accounts', { accounts: relevantAccounts });
});

/**
 * Request specific account (same page)
 */
app.get('/accounts/:address', async(req, res) => {
    const { data: accounts } = await api.accounts.get({ address: req.params.address });
    res.render('accounts', { accounts });
});

/**
 * Request faucet page for funding accounts from genesis
 */
app.get('/faucet', async(req, res) => {
    res.render('faucet', { accounts: accounts.examples });
});

/**
 * Request initialize page for initializing new product or pallet accounts from genesis
 */
app.get('/initialize', async(req, res) => {
    const getAccountCredentials = () => {
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

    const accountCredentials = getAccountCredentials();

    let tx = new transactions.TransferTransaction({
        asset: {
            amount: '1',
            recipientId: accountCredentials.address,
        },
        networkIdentifier: networkIdentifier,
    });

    tx.sign(accounts.genesis.passphrase);
    res.render('initialize', { accountCredentials });

    api.transactions.broadcast(tx.toJSON()).then(res => {
        console.log("++++++++++++++++ API Response +++++++++++++++++");
        console.log(res.data);
        console.log("++++++++++++++++ Credentials +++++++++++++++++");
        console.dir(accountCredentials);
        console.log("++++++++++++++++ Transaction Payload +++++++++++++++++");
        console.log(tx.stringify());
        console.log("++++++++++++++++ End Script +++++++++++++++++");
    }).catch(err => {
        console.log(JSON.stringify(err.errors, null, 2));
    });

    res.end()
});

/**
 * Page for displaying responses
 */
app.get('/payload', async(req, res) => {
    res.render('payload', { transaction: res.app.locals.payload.tx, response: res.app.locals.payload.res });
});

/**
 * Request page for registring new market
 */
app.get('/post-register-market', async(req, res) => {
    res.render('post-register-market');
});

/**
 * Request page for registring new producer
 */
app.get('/post-register-producer', async(req, res) => {
    res.render('post-register-producer');
});

/**
 * Request page for registring new product
 */
app.get('/post-register-product', async(req, res) => {
    const accountsArray = await getAccounts();

    let relevantAccounts = [];
    for (var i = 0; i < accountsArray.length; i++) {
	let accountAsset = accountsArray[i].asset;
        if (accountsArray[i].balance == 1 && accountAsset && Object.keys(accountAsset).length == 0) {
            relevantAccounts.push(accountsArray[i]);
        }
    }
    res.render('post-register-product', { accounts: relevantAccounts });
});

/**
 * Request page for registring new pallet
 */
app.get('/post-register-pallet', async(req, res) => {
    const accountsArray = await getAccounts();

    let relevantAccounts = [];
    let productAccounts = [];
    for (var i = 0; i < accountsArray.length; i++) {
	let accountAsset = accountsArray[i].asset;
        if (accountsArray[i].balance == 1 && accountAsset && Object.keys(accountAsset).length == 0) {
            relevantAccounts.push(accountsArray[i]);
        } else if (accountAsset && Object.keys(accountAsset).length > 0 && accountAsset.type == "Product") {
	    productAccounts.push(accountsArray[i]);
	}
    }
    res.render('post-register-pallet', { accounts: relevantAccounts, products: productAccounts });
});

/**
 * Request page for starting a new transport
 */
app.get('/post-start-transport', async(req, res) => {
    const accountsArray = await getAccounts();

    let palletAccounts = [];
    for (var i = 0; i < accountsArray.length; i++) {
	let accountAsset = accountsArray[i].asset;
        if (accountAsset && Object.keys(accountAsset).length > 0 && accountAsset.status == "pending") {
            palletAccounts.push(accountsArray[i]);
	}
    }
    res.render('post-start-transport', { accounts: palletAccounts });
});

/**
 * Request page for finishing a transport
 */
app.get('/post-finish-transport', async(req, res) => {
    const accountsArray = await getAccounts();

    let palletAccounts = [];
    for (var i = 0; i < accountsArray.length; i++) {
	let accountAsset = accountsArray[i].asset;
        if (accountAsset && Object.keys(accountAsset).length > 0 && accountAsset.status == "ongoing") {
            palletAccounts.push(accountsArray[i]);
	}
    }
    res.render('post-finish-transport', { accounts: palletAccounts });
});


/**
 * Request page for updating product info
 */
app.get('/post-update-product', async(req, res) => {
    const accountsArray = await getAccounts();

    let relevantAccounts = [];
    for (var i = 0; i < accountsArray.length; i++) {
	let accountAsset = accountsArray[i].asset;
        if (accountAsset && Object.keys(accountAsset).length > 0 && accountAsset.type == "Product"
	    && accountAsset.remaining_quantity < accountAsset.produced_quantity
	    && !accountAsset.fitinfo) {
            relevantAccounts.push(accountsArray[i]);
        }
    }
    res.render('post-update-product', { accounts: relevantAccounts });
});

app.post('/faucet', function (req, res) {
    const address = req.body.address;
    const amount = req.body.amount;

    const fundTransaction = new transactions.TransferTransaction({
        asset: {
            recipientId: address,
            amount: transactions.utils.convertLSKToBeddows(amount),
        },
        networkIdentifier: networkIdentifier,
    });

    fundTransaction.sign(accounts.genesis.passphrase);
    api.transactions.broadcast(fundTransaction.toJSON()).then(response => {
        res.app.locals.payload = {
            res: response.data,
            tx: fundTransaction.toJSON(),
        };
        console.log("++++++++++++++++ API Response +++++++++++++++++");
        console.log(response.data);
        console.log("++++++++++++++++ Transaction Payload +++++++++++++++++");
        console.log(fundTransaction.stringify());
        console.log("++++++++++++++++ End Script +++++++++++++++++");
        res.redirect('/payload');
    }).catch(err => {
        console.log(JSON.stringify(err.errors, null, 2));
        res.app.locals.payload = {
            res: err,
            tx: fundTransaction.toJSON(),
        };
        res.redirect('/payload');
    });
});

app.post('/post-register-market', function (req, res) {
    const marketId = req.body.marketid;
    const name = req.body.name;
    const latitude = req.body.latitude;
    const longitude = req.body.longitude;

    const registerMarketTransaction = new RegisterMarketTransaction({
        asset: {
            marketId,
            name,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
        },
        networkIdentifier: networkIdentifier,
        timestamp: dateToLiskEpochTimestamp(new Date()),
    });

    registerMarketTransaction.sign(accounts.genesis.passphrase);

    api.transactions.broadcast(registerMarketTransaction.toJSON()).then(response => {
        res.app.locals.payload = {
            res: response.data,
            tx: registerMarketTransaction.toJSON(),
        };
        console.log("++++++++++++++++ API Response +++++++++++++++++");
        console.log(response.data);
        console.log("++++++++++++++++ Transaction Payload +++++++++++++++++");
        console.log(registerMarketTransaction.stringify());
        console.log("++++++++++++++++ End Script +++++++++++++++++");
        res.redirect('/payload');
    }).catch(err => {
        console.log(JSON.stringify(err.errors, null, 2));
        res.app.locals.payload = {
            res: err,
            tx: registerMarketTransaction.toJSON(),
        };
        res.redirect('/payload');
    });
});

app.post('/post-register-producer', function (req, res) {
    const producerId = req.body.producerid;
    const name = req.body.name;
    const latitude = req.body.latitude;
    const longitude = req.body.longitude;

    const registerProducerTransaction = new RegisterProducerTransaction({
        asset: {
            producerId,
            name,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
        },
        networkIdentifier: networkIdentifier,
        timestamp: dateToLiskEpochTimestamp(new Date()),
    });

    registerProducerTransaction.sign(accounts.genesis.passphrase);

    api.transactions.broadcast(registerProducerTransaction.toJSON()).then(response => {
        res.app.locals.payload = {
            res: response.data,
            tx: registerProducerTransaction.toJSON(),
        };
        console.log("++++++++++++++++ API Response +++++++++++++++++");
        console.log(response.data);
        console.log("++++++++++++++++ Transaction Payload +++++++++++++++++");
        console.log(registerProducerTransaction.stringify());
        console.log("++++++++++++++++ End Script +++++++++++++++++");
        res.redirect('/payload');
    }).catch(err => {
        console.log(JSON.stringify(err.errors, null, 2));
        res.app.locals.payload = {
            res: err,
            tx: registerProducerTransaction.toJSON(),
        };
        res.redirect('/payload');
    });
});

app.post('/post-register-product', function (req, res) {
    const productId = req.body.productid;
    const name = req.body.name;
    const barcode = req.body.barcode;
    const batch = req.body.batch;
    const produced_quantity = req.body.produced_quantity;
    const produced_date = req.body.produced_date;
    const due_date = req.body.due_date;
    const passphrase = req.body.passphrase;

    const registerProductTransaction = new RegisterProductTransaction({
        asset: {
            productId,
            name,
            barcode,
            batch,
            produced_quantity: parseInt(produced_quantity),
            produced_date,
            due_date,
        },
        networkIdentifier: networkIdentifier,
        timestamp: dateToLiskEpochTimestamp(new Date()),
    });

    registerProductTransaction.sign(passphrase);

    api.transactions.broadcast(registerProductTransaction.toJSON()).then(response => {
        res.app.locals.payload = {
            res: response.data,
            tx: registerProductTransaction.toJSON(),
        };
        console.log("++++++++++++++++ API Response +++++++++++++++++");
        console.log(response.data);
        console.log("++++++++++++++++ Transaction Payload +++++++++++++++++");
        console.log(registerProductTransaction.stringify());
        console.log("++++++++++++++++ End Script +++++++++++++++++");
        res.redirect('/payload');
    }).catch(err => {
        console.log(JSON.stringify(err.errors, null, 2));
        res.app.locals.payload = {
            res: err,
            tx: registerProductTransaction.toJSON(),
        };
        res.redirect('/payload');
    });
});

app.post('/post-register-pallet', function (req, res) {
    const palletId = req.body.palletid;
    const recipientId = req.body.recipientid;
    const postage = transactions.utils.convertLSKToBeddows(req.body.postage);
    const security = transactions.utils.convertLSKToBeddows(req.body.security);
    const productId = req.body.productid;
    const product_quantity = parseInt(req.body.product_quantity);
    const passphrase = req.body.passphrase;

    const registerPalletTransaction = new RegisterPalletTransaction({
        asset: {
            palletId,
            recipientId,
            postage,
            security,
            productId,
            product_quantity
        },
        networkIdentifier: networkIdentifier,
        timestamp: dateToLiskEpochTimestamp(new Date()),
    });

    registerPalletTransaction.sign(passphrase);

    api.transactions.broadcast(registerPalletTransaction.toJSON()).then(response => {
        res.app.locals.payload = {
            res: response.data,
            tx: registerPalletTransaction.toJSON(),
        };
        console.log("++++++++++++++++ API Response +++++++++++++++++");
        console.log(response.data);
        console.log("++++++++++++++++ Transaction Payload +++++++++++++++++");
        console.log(registerPalletTransaction.stringify());
        console.log("++++++++++++++++ End Script +++++++++++++++++");
        res.redirect('/payload');
    }).catch(err => {
        console.log(JSON.stringify(err.errors, null, 2));
        res.app.locals.payload = {
            res: err,
            tx: registerPalletTransaction.toJSON(),
        };
        res.redirect('/payload');
    });
});

app.post('/post-start-transport', function (req, res) {
    const palletId = req.body.palletid;
    const passphrase = req.body.passphrase;

    const startTransportTransaction = new StartTransportTransaction({
        asset: {
            palletId
        },
        networkIdentifier: networkIdentifier,
        timestamp: dateToLiskEpochTimestamp(new Date()),
    });

    startTransportTransaction.sign(passphrase);

    api.transactions.broadcast(startTransportTransaction.toJSON()).then(response => {
        res.app.locals.payload = {
            res: response.data,
            tx: startTransportTransaction.toJSON(),
        };
        console.log("++++++++++++++++ API Response +++++++++++++++++");
        console.log(response.data);
        console.log("++++++++++++++++ Transaction Payload +++++++++++++++++");
        console.log(startTransportTransaction.stringify());
        console.log("++++++++++++++++ End Script +++++++++++++++++");
        res.redirect('/payload');
    }).catch(err => {
        console.log(JSON.stringify(err.errors, null, 2));
        res.app.locals.payload = {
            res: err,
            tx: startTransportTransaction.toJSON(),
        };
        res.redirect('/payload');
    });
});

app.post('/post-finish-transport', function (req, res) {
    const palletId = req.body.palletid;
    const status = req.body.status;
    const passphrase = req.body.passphrase;

    const finishTransportTransaction = new FinishTransportTransaction({
        asset: {
            palletId,
	    status
        },
        networkIdentifier: networkIdentifier,
        timestamp: dateToLiskEpochTimestamp(new Date()),
    });

    finishTransportTransaction.sign(passphrase);

    api.transactions.broadcast(finishTransportTransaction.toJSON()).then(response => {
        res.app.locals.payload = {
            res: response.data,
            tx: finishTransportTransaction.toJSON(),
        };
        console.log("++++++++++++++++ API Response +++++++++++++++++");
        console.log(response.data);
        console.log("++++++++++++++++ Transaction Payload +++++++++++++++++");
        console.log(finishTransportTransaction.stringify());
        console.log("++++++++++++++++ End Script +++++++++++++++++");
        res.redirect('/payload');
    }).catch(err => {
        console.log(JSON.stringify(err.errors, null, 2));
        res.app.locals.payload = {
            res: err,
            tx: finishTransportTransaction.toJSON(),
        };
        res.redirect('/payload');
    });
});

app.post('/post-update-product', function (req, res) {
    const productId = req.body.productid;
    const organic = req.body.organic;
    const noTACC = req.body.notacc;
    const transFat = req.body.transfat;
    const daily_units = parseInt(req.body.daily_units);
    const passphrase = req.body.passphrase;

    const updateProductTransaction = new UpdateProductTransaction({
        asset: {
            productId,
            organic,
            noTACC,
            transFat,
            daily_units
        },
        networkIdentifier: networkIdentifier,
        timestamp: dateToLiskEpochTimestamp(new Date()),
    });

    updateProductTransaction.sign(passphrase);

    api.transactions.broadcast(updateProductTransaction.toJSON()).then(response => {
        res.app.locals.payload = {
            res: response.data,
            tx: updateProductTransaction.toJSON(),
        };
        console.log("++++++++++++++++ API Response +++++++++++++++++");
        console.log(response.data);
        console.log("++++++++++++++++ Transaction Payload +++++++++++++++++");
        console.log(updateProductTransaction.stringify());
        console.log("++++++++++++++++ End Script +++++++++++++++++");
        res.redirect('/payload');
    }).catch(err => {
        console.log(JSON.stringify(err.errors, null, 2));
        res.app.locals.payload = {
            res: err,
            tx: updateProductTransaction.toJSON(),
        };
        res.redirect('/payload');
    });
});

app.listen(PORT, () => console.info(`Explorer app listening on port ${PORT}!`));
