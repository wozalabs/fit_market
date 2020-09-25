const {
    BaseTransaction,
    TransactionError,
    utils
} = require('@liskhq/lisk-transactions');

/**
 * Register new pallet for sender and update pallet account.
 */
class RegisterPalletTransaction extends BaseTransaction {

    static get TYPE () {
        return 50;
    }

    static get FEE () {
        return '0';
    };

    async prepare(store) {
        await store.account.cache([
            {
                address: this.asset.palletId,
            },
            {
                address: this.senderId,
            },
            {
                address: this.asset.productId,
            },
        ]);
    }

    validateAsset() {
        // Static checks for presence of `palletId`, `postage`, `security`, `product_quantity`.
        const errors = [];
        if (!this.asset.palletId || typeof this.asset.palletId !== 'string') {
            errors.push(
                new TransactionError(
                    'Invalid "asset.palletId" defined on transaction',
                    this.id,
                    '.asset.palletId',
                    this.asset.palletId
                )
            );
        }
        if (!this.asset.postage || typeof this.asset.postage !== 'string') {
            errors.push(
                new TransactionError(
                    'Invalid "asset.postage" defined on transaction',
                    this.id,
                    '.asset.postage',
                    this.asset.postage,
                    'A string value',
                )
            );
        }
        if (!this.asset.security || typeof this.asset.security !== 'string') {
            errors.push(
                new TransactionError(
                    'Invalid "asset.security" defined on transaction',
                    this.id,
                    '.asset.security',
                    this.asset.security,
                    'A string value',
                )
            );
        }
        if (typeof this.asset.product_quantity !== 'number' || isNaN(this.asset.product_quantity) || !isFinite(this.asset.product_quantity)) {
            errors.push(
                new TransactionError(
                    'Invalid "asset.product_quantity" defined on transaction',
                    this.id,
                    '.asset.product_quantity',
                    this.asset.product_quantity,
                    'A number value',
                )
            );
        }
        return errors;
    }

    applyAsset(store) {
        const errors = [];
        const pallet = store.account.get(this.asset.palletId);

        if (!pallet.asset.status) {
            /**
             * Update the sender account:
             * - Deduct the postage from senders' account balance
             */
            const sender = store.account.get(this.senderId);
            const senderBalancePostageDeducted = new utils.BigNum(sender.balance).sub(
                new utils.BigNum(this.asset.postage)
            );
            const updatedSender = {
                ...sender,
                balance: senderBalancePostageDeducted.toString(),
            };
            store.account.set(sender.address, updatedSender);

            /**
             * Update the product account:
             * - Deduct product_quantity from product's remaining_quantity
             */
            const product = store.account.get(this.asset.productId);
            const productRemainingQuantity = product.asset.remaining_quantity - this.asset.product_quantity;
            
            product.asset.remaining_quantity = productRemainingQuantity;

            store.account.set(product.address, product);

            /**
             * Update the pallet account:
             * - Add the postage to the pallet account balance
             * - Add all important data about the pallet inside the asset field:
             *   - recipient: ID of the pallet recipient
             *   - sender: ID of the pallet sender
             *   - carrier: ID of the pallet carrier
             *   - security: Number of tokens the carrier needs to lock during the transport of the pallet
             *   - postage: Number of tokens the sender needs to pay for transportation of the pallet
             *   - status: Status of the transport (pending|ongoing|success|fail)
             *   - product: ID of the product
             *   - product_quantity: amount of products carried on this pallet
             */
            const palletBalanceWithPostage = new utils.BigNum(pallet.balance).add(
                new utils.BigNum(this.asset.postage)
            );

            const updatedPalletAccount = {
                ...pallet,
                ...{
                    balance: palletBalanceWithPostage.toString(),
                    asset: {
                        recipient: this.asset.recipientId,
                        sender: this.senderId,
                        security: this.asset.security,
                        postage: this.asset.postage,
                        status: 'pending',
                        carrier: null,
                        product: this.asset.productId,
                        product_quantity: this.asset.product_quantity
                    }
                }
            };
            store.account.set(pallet.address, updatedPalletAccount);
        } else {
            errors.push(
                new TransactionError(
                    'pallet has already been registered',
                    pallet.asset.status
                )
            );
        }
        return errors;
    }

    undoAsset(store) {
        const errors = [];

        /* --- Revert sender account --- */
        const sender = store.account.get(this.senderId);
        const senderBalanceWithPostage = new utils.BigNum(sender.balance).add(
            new utils.BigNum(this.asset.postage)
        );
        const updatedSender = {
            ...sender,
            balance: senderBalanceWithPostage.toString()
        };
        store.account.set(sender.address, updatedSender);

        /* --- Revert product account --- */
        const product = store.account.get(this.asset.productId);
        const productRemainingQuantity = product.asset.remaining_quantity + this.asset.product_quantity;

        product.asset.remaining_quantity = productRemainingQuantity;

        store.account.set(product.address, product);

        /* --- Revert pallet account --- */
        const pallet = store.account.get(this.asset.palletId);
        const originalPalletAccount = { ...pallet, balance: 0, asset: null };
        store.account.set(pallet.address, originalPalletAccount);

        return errors;
    }

}

module.exports = RegisterPalletTransaction;
