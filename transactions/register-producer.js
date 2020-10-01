const {
    BaseTransaction,
    TransactionError,
    utils
} = require('@liskhq/lisk-transactions');

/**
 * Register new producer
 */
class RegisterProducerTransaction extends BaseTransaction {

    static get TYPE () {
        return 30;
    }

    static get FEE () {
        return '0';
    };

    async prepare(store) {
        await store.account.cache([
            {
                address: this.asset.producerId,
            },
            {
                address: this.senderId,
            }
        ]);
    }

    validateAsset() {
        // Static checks for presence of `producerId`, `name`, `latitude`, `longitude`
        const errors = [];
        if (!this.asset.producerId || typeof this.asset.producerId !== 'string') {
            errors.push(
                new TransactionError(
                    'Invalid "asset.producerId" defined on transaction',
                    this.id,
                    '.asset.producerId',
                    this.asset.producerId
                )
            );
        }
        if (!this.asset.name || typeof this.asset.name !== 'string') {
            errors.push(
                new TransactionError(
                    'Invalid "asset.name" defined on transaction',
                    this.id,
                    '.asset.name',
                    this.asset.name,
                    'A string value'
                )
            );
        }
        if (typeof this.asset.latitude !== 'number' || isNaN(parseFloat(this.asset.latitude)) || !isFinite(this.asset.latitude)) {
            errors.push(
                new TransactionError(
                    'Invalid "asset.latitude" defined on transaction',
                    this.id,
                    '.asset.latitude',
                    this.asset.latitude,
                    'A number value'
                )
            );
        }
        if (typeof this.asset.longitude !== 'number' || isNaN(parseFloat(this.asset.longitude)) || !isFinite(this.asset.longitude)) {
            errors.push(
                new TransactionError(
                    'Invalid "asset.longitude" defined on transaction',
                    this.id,
                    '.asset.longitude',
                    this.asset.longitude,
                    'A number value'
                )
            );
        }
        return errors;
    }

    applyAsset(store) {
        const errors = [];
        const producer = store.account.get(this.asset.producerId);

        if (!producer.asset.name) {

            /* --- Modify producer account --- */
            /**
             * Update the producer account:
             * - Add all important data about the producer inside the asset field:
             *   - name: Name of the producer company
             *   - latitude: Latitude of the producer company location
             *   - longitude: Longitude of the producer company location
             *   - type: String to differentiate from other account types
             */

            const updatedProducerAccount = {
                ...producer,
                ...{
                    asset: {
                        name: this.asset.name,
                        latitude: this.asset.latitude,
                        longitude: this.asset.longitude,
                        type: "Producer"
                    }
                }
            };
            store.account.set(producer.address, updatedProducerAccount);
        } else {
            errors.push(
                new TransactionError(
                    'producer has already been registered',
                    producer.asset.name
                )
            );
        }
        return errors;
    }

    undoAsset(store) {
        const errors = [];

        /* --- Revert producer account --- */
        const producer = store.account.get(this.asset.producerId);
        const originalProducerAccount = { ...producer, asset: null };
        store.account.set(producer.address, originalProducerAccount);
        
        return errors;
    }

}

module.exports = RegisterProducerTransaction;
