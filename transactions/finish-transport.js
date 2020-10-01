const {
    BaseTransaction,
    TransactionError,
    utils
} = require('@liskhq/lisk-transactions');

class FinishTransportTransaction extends BaseTransaction {

    static get TYPE () {
        return 70;
    }

    static get FEE () {
        return '0';
    };

    async prepare(store) {
        /**
         * Get pallet account
         */
        await store.account.cache([
            {
                address: this.asset.palletId,
            },
            {
                address: this.senderId,
            }
        ]);
        /**
         * Get sender, carrier and recipient accounts of the pallet
         */
        const pallet = store.account.get(this.asset.palletId);
        await store.account.cache([
            {
                address: pallet.asset.carrier,
            },
            {
                address: pallet.asset.sender,
            },
            {
                address: this.senderId,
            },
        ]);
    }

    validateAsset() {
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
        if (!this.asset.status || typeof this.asset.status !== 'string') {
            errors.push(
                new TransactionError(
                    'Invalid "asset.status" defined on transaction',
                    this.id,
                    '.asset.status',
                    this.asset.status
                )
            );
        }
        return errors;
    }

    applyAsset(store) {
        const errors = [];
        let pallet = store.account.get(this.asset.palletId);
        let carrier = store.account.get(pallet.asset.carrier);
        let sender = store.account.get(pallet.asset.sender);
        let recipient = store.account.get(this.senderId);

        // if the transaction has been signed by the pallet recipient
        if (recipient.address === pallet.asset.recipient) {
            // if the pallet status isn't "ongoing"
            if (pallet.asset.status !==  "ongoing") {
                errors.push(
                    new TransactionError(
                        'FinishTransport can only be triggered, if pallet status is "ongoing"',
                        this.id,
                        'ongoing',
                        this.asset.status
                    )
                );
                return errors;
            }
            // if the transport was a success
            if ( this.asset.status === "success") {
                /**
                 * Update the Carrier account:
                 * - Unlock security
                 * - Add postage & security to balance
                 */
                const carrierBalanceWithSecurityAndPostage = new utils.BigNum(carrier.balance).add(new utils.BigNum(pallet.asset.security)).add(new utils.BigNum(pallet.asset.postage));

                carrier.balance = carrierBalanceWithSecurityAndPostage.toString();
                carrier.asset.lockedSecurity = null;

                store.account.set(carrier.address, carrier);
                /**
                 * Update the Packet account:
                 * - Remove postage from balance
                 * - Change status to "success"
                 */
                pallet.balance = '0';
                pallet.asset.status = 'success';

                store.account.set(pallet.address, pallet);
                return errors;
            }
            // if the transport failed
            /**
             * Update the Sender account:
             * - Add postage and security to balance
             */
            const senderBalanceWithSecurityAndPostage = new utils.BigNum(sender.balance).add(new utils.BigNum(pallet.asset.security)).add(new utils.BigNum(pallet.asset.postage));

            sender.balance = senderBalanceWithSecurityAndPostage.toString();

            store.account.set(sender.address, sender);
            /**
             * Update the Carrier account:
             * - Set lockedSecurity to 0
             */
            carrier.asset.lockedSecurity = null;

            store.account.set(carrier.address, carrier);
            /**
             * Update the Packet account:
             * - set status to "fail"
             * - Remove postage from balance
             */
            pallet.balance = '0';
            pallet.asset.status = 'fail';

            store.account.set(pallet.address, pallet);

            return errors;
        }
        errors.push(
            new TransactionError(
                'FinishTransport transaction needs to be signed by the recipient of the pallet',
                this.id,
                '.asset.recipient',
                this.asset.recipient
            )
        );
        return errors;
    }

    undoAsset(store) {
        const errors = [];
        const pallet = store.account.get(this.asset.palletId);
        const carrier = store.account.get(pallet.carrier);
        const sender = store.account.get(pallet.sender);
        /* --- Revert successful transport --- */
        if ( this.asset.status === "success") {
            /* --- Revert carrier account --- */
            const carrierBalanceWithoutSecurityAndPostage = new utils.BigNum(carrier.balance).sub(new utils.BigNum(pallet.asset.security)).sub(new utils.BigNum(pallet.asset.postage));

            carrier.balance = carrierBalanceWithoutSecurityAndPostage.toString();
            carrier.asset.lockedSecurity = pallet.asset.security;

            store.account.set(carrier.address, carrier);

        /* --- Revert failed transport --- */
        } else {
            /* --- Revert sender account --- */
            const senderBalanceWithoutSecurityAndPostage = new utils.BigNum(sender.balance).sub(new utils.BigNum(pallet.asset.security)).sub(new utils.BigNum(pallet.asset.postage));
            sender.balance = senderBalanceWithoutSecurityAndPostage.toString();
            store.account.set(sender.address, sender);
            /* --- Revert carrier account --- */
            carrier.asset.lockedSecurity = pallet.asset.security;
            store.account.set(carrier.address, carrier);
        }
        /* --- Revert pallet account --- */
        pallet.balance = pallet.asset.postage;
        pallet.asset.status = "ongoing";

        store.account.set(pallet.address, pallet);
        return errors;
    }
}

module.exports = FinishTransportTransaction;
