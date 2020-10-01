const {
    BaseTransaction,
    TransactionError,
    utils
} = require('@liskhq/lisk-transactions');

/**
 * Register new market
 */
class RegisterMarketTransaction extends BaseTransaction {

    static get TYPE () {
        return 20;
    }

    static get FEE () {
        return '0';
    };

    async prepare(store) {
        await store.account.cache([
            {
                address: this.asset.marketId,
            },
            {
                address: this.senderId,
            }
        ]);
    }

    validateAsset() {
        // Static checks for presence of `marketId`, `name`, `latitude`, `longitude`
        const errors = [];
        if (!this.asset.marketId || typeof this.asset.marketId !== 'string') {
            errors.push(
                new TransactionError(
                    'Invalid "asset.marketId" defined on transaction',
                    this.id,
                    '.asset.marketId',
                    this.asset.marketId
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
        const market = store.account.get(this.asset.marketId);

        if (!market.asset.name) {

            /* --- Modify market account --- */
            /**
             * Update the market account:
             * - Add all important data about the market inside the asset field:
             *   - name: Name of the market company
             *   - latitude: Latitude of the market company location
             *   - longitude: Longitude of the market company location
             *   - type: String to differentiate from other account types
             */

            const updatedMarketAccount = {
                ...market,
                ...{
                    asset: {
                        name: this.asset.name,
                        latitude: this.asset.latitude,
                        longitude: this.asset.longitude,
                        type: "Market"
                    }
                }
            };
            store.account.set(market.address, updatedMarketAccount);
        } else {
            errors.push(
                new TransactionError(
                    'market has already been registered',
                    market.asset.name
                )
            );
        }
        return errors;
    }

    undoAsset(store) {
        const errors = [];

        /* --- Revert market account --- */
        const market = store.account.get(this.asset.marketId);
        const originalMarketAccount = { ...market, asset: null };
        store.account.set(market.address, originalMarketAccount);
        
        return errors;
    }

}

module.exports = RegisterMarketTransaction;
