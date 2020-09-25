const { Application, genesisBlockDevnet, configDevnet } = require('lisk-sdk');
const RegisterMarketTransaction = require('../transactions/register-market');
const RegisterProducerTransaction = require('../transactions/register-producer');
const RegisterProductTransaction = require('../transactions/register-product');
const RegisterPalletTransaction = require('../transactions/register-pallet');
const StartTransportTransaction = require('../transactions/start-transport');
const FinishTransportTransaction = require('../transactions/finish-transport');
const UpdateProductTransaction = require('../transactions/update-product');

configDevnet.app.label = 'fit-market';
// configDevnet.modules.http_api.access.public = true;
// configDevnet.components.storage.host = 'localhost';
// configDevnet.components.storage.user = 'lisk'; 
// configDevnet.components.storage.password = 'password';

const app = new Application(genesisBlockDevnet, configDevnet);

app.registerTransaction(RegisterMarketTransaction);
app.registerTransaction(RegisterProducerTransaction);
app.registerTransaction(RegisterProductTransaction);
app.registerTransaction(RegisterPalletTransaction);
app.registerTransaction(StartTransportTransaction);
app.registerTransaction(FinishTransportTransaction);
app.registerTransaction(UpdateProductTransaction);

app
    .run()
    .then(() => app.logger.info('App started...'))
    .catch(error => {
        console.error('Faced error in application', error);
        process.exit(0);
    });

