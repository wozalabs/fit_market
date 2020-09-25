const {
    BaseTransaction,
    TransactionError,
    utils
} = require('@liskhq/lisk-transactions');

/**
 * Register new product
 */
class RegisterProductTransaction extends BaseTransaction {

    static get TYPE () {
        return 40;
    }

    static get FEE () {
        return '0';
    };

    async prepare(store) {
        await store.account.cache([
            {
                address: this.asset.productId,
            }
        ]);
    }

    validateAsset() {
        // Static checks for presence of `productId`, `barcode`, `batch`, `name`, `produced_quantity`, `produced_date`, `due_date`
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
        if (!this.asset.barcode || typeof this.asset.barcode !== 'string') {
            errors.push(
                new TransactionError(
                    'Invalid "asset.barcode" defined on transaction',
                    this.id,
                    '.asset.barcode',
                    this.asset.barcode,
                    'A string value'
                )
            );
        }
        if (!this.asset.batch || typeof this.asset.batch !== 'string') {
            errors.push(
                new TransactionError(
                    'Invalid "asset.batch" defined on transaction',
                    this.id,
                    '.asset.batch',
                    this.asset.batch,
                    'A string value'
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
        if (typeof this.asset.produced_quantity !== 'number' || isNaN(this.asset.produced_quantity) || !isFinite(this.asset.produced_quantity)) {
            errors.push(
                new TransactionError(
                    'Invalid "asset.produced_quantity" defined on transaction',
                    this.id,
                    '.asset.produced_quantity',
                    this.asset.produced_quantity,
                    'A number value'
                )
            );
        }
        if (!this.asset.produced_date || typeof this.asset.produced_date !== 'string') {
            errors.push(
                new TransactionError(
                    'Invalid "asset.produced_date" defined on transaction',
                    this.id,
                    '.asset.produced_date',
                    this.asset.produced_date,
                    'A string value'
                )
            );
        }
        if (!this.asset.due_date || typeof this.asset.due_date !== 'string') {
            errors.push(
                new TransactionError(
                    'Invalid "asset.due_date" defined on transaction',
                    this.id,
                    '.asset.due_date',
                    this.asset.due_date,
                    'A string value'
                )
            );
        }
        return errors;
    }

    applyAsset(store) {
        const errors = [];
        const product = store.account.get(this.asset.productId);

        if (!product.asset.name) {

            /* --- Modify product account --- */
            /**
             * Update the product account:
             * - Add all important data about the product inside the asset field:
             *   - barcode: Product's barcode
             *   - batch: Production batch ID
             *   - name: Name of the product company
             *   - produced_quantity: Number of units produced on this batch
             *   - remaining_quantity: Number of stock units.
             *   - produced_date: Date on which batch was produced, as timestamp
             *   - due_date: Date on which products are due, as timestamp
             */

            const updatedProductAccount = {
                ...product,
                ...{
                    asset: {
                        barcode: this.asset.barcode,
                        batch: this.asset.batch,
                        name: this.asset.name,
                        produced_quantity: this.asset.produced_quantity,
                        remaining_quantity: this.asset.produced_quantity,
                        produced_date: this.asset.produced_date,
                        due_date: this.asset.due_date,
                        type: "Product"
                    }
                }
            };
            store.account.set(product.address, updatedProductAccount);
        } else {
            errors.push(
                new TransactionError(
                    'product has already been registered',
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
        const originalProductAccount = { ...product, asset: null };
        store.account.set(product.address, originalProductAccount);
        
        return errors;
    }

}

module.exports = RegisterProductTransaction;
