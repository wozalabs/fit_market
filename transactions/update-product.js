const {
    BaseTransaction,
    TransactionError,
    utils
} = require('@liskhq/lisk-transactions');

class UpdateProductTransaction extends BaseTransaction {

    static get TYPE () {
        return 80;
    }

    static get FEE () {
        return '0';
    };

    async prepare(store) {
        await store.account.cache([
            {
                address: this.asset.productId,
            },
            {
                address: this.senderId,
            }
        ]);
    }

    validateAsset() {
        // Static checks for presence of `productId`, `organic`, `tacc`, `transFat`, `daily_units`
        const errors = [];
        if (!this.asset.productId || typeof this.asset.productId !== 'string') {
            errors.push(
                new TransactionError(
                    'Invalid "asset.productId" defined on transaction',
                    this.id,
                    '.asset.productId',
                    this.asset.productId
                )
            );
        }
        if (!this.asset.organic || typeof this.asset.organic !== 'string') {
            errors.push(
                new TransactionError(
                    'Invalid "asset.organic" defined on transaction',
                    this.id,
                    '.asset.organic',
                    this.asset.organic,
                    'A string value'
                )
            );
        }
        if (!this.asset.noTACC || typeof this.asset.noTACC !== 'string') {
            errors.push(
                new TransactionError(
                    'Invalid "asset.noTACC" defined on transaction',
                    this.id,
                    '.asset.noTACC',
                    this.asset.noTACC,
                    'A string value'
                )
            );
        }
        if (!this.asset.transFat || typeof this.asset.transFat !== 'string') {
            errors.push(
                new TransactionError(
                    'Invalid "asset.transFat" defined on transaction',
                    this.id,
                    '.asset.transFat',
                    this.asset.transFat,
                    'A string value'
                )
            );
        }
        if (typeof this.asset.daily_units !== 'number' || isNaN(parseFloat(this.asset.daily_units)) || !isFinite(this.asset.daily_units)) {
            errors.push(
                new TransactionError(
                    'Invalid "asset.daily_units" defined on transaction',
                    this.id,
                    '.asset.daily_units',
                    this.asset.daily_units,
                    'A number value'
                )
            );
        }
        return errors;
    }

    applyAsset(store) {
        const errors = [];
        const product = store.account.get(this.asset.productId);

        if (!product.asset.fitinfo) {

            /**
             * Update the product account:
             *   - organic: true | false | unknown
             *   - noTACC: true | false | unknown
             *   - transFat: true | false | unknown
             *   - daily_units: MAX daily units according to ingredients
             */

            product.asset.fitinfo = {};
            product.asset.fitinfo.organic = this.asset.organic;
            product.asset.fitinfo.noTACC = this.asset.noTACC;
            product.asset.fitinfo.transFat = this.asset.transFat;
            product.asset.fitinfo.daily_units = this.asset.daily_units;
            product.asset.fitinfo.market = this.senderId;

            store.account.set(product.address, product);
        } else {
            errors.push(
                new TransactionError(
                    'product has already been updated',
                    product.asset.name
                )
            );
        }
        return errors;
    }

    undoAsset(store) {
        const errors = [];

        /* --- Revert product account --- */
        const product = store.account.get(this.asset.productId);
        product.asset.fitinfo = null;
        store.account.set(product.address, product);
        
        return errors;
    }

}

module.exports = UpdateProductTransaction;
