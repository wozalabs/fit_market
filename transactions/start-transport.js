const {
    BaseTransaction,
    TransactionError,
    utils
} = require('@liskhq/lisk-transactions');

class StartTransportTransaction extends BaseTransaction {

    static get TYPE () {
        return 60;
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
            }
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

        return errors;
    }

    applyAsset(store) {
        const errors = [];
        const pallet = store.account.get(this.asset.palletId);

        if (pallet.asset.status === "pending"){
            const carrier = store.account.get(this.senderId);
            const carrierBalance = new utils.BigNum(carrier.balance);
            const palletSecurity = new utils.BigNum(pallet.asset.security);

            if (carrierBalance.gte(palletSecurity)) {
                /**
                 * Update the Carrier account:
                 * - Lock security inside the account
                 * - Remove the security form balance
                 */
                const carrierBalanceWithoutSecurity = carrierBalance.sub(palletSecurity);
                const updatedCarrier = {
                    ...carrier,
                    ...{
                        balance: carrierBalanceWithoutSecurity.toString(),
                        asset: {
                            lockedSecurity: pallet.asset.security,
                        }
                    }
                };
                store.account.set(carrier.address, updatedCarrier);
                /**
                 * Update the Packet account:
                 * - Set status to "ongoing"
                 * - set carrier to ID of the carrier
                 */
                pallet.asset.status = "ongoing";
                pallet.asset.carrier = carrier.address;
                store.account.set(pallet.address, pallet);
            } else {
                errors.push(
                    new TransactionError(
                        'carrier has not enough balance to pay the security',
                        pallet.asset.security,
                        carrier.balance
                    )
                );
            }
        } else {
            errors.push(
                new TransactionError(
                    'pallet status needs to be "pending"',
                    pallet.asset.status
                )
            );
        }

        return errors;
    }

    undoAsset(store) {
        const errors = [];
        const pallet = store.account.get(this.asset.palletId);
        const carrier = store.account.get(this.senderId);

        /* --- Revert carrier account --- */
        const carrierBalanceWithSecurity = new utils.BigNum(carrier.balance).add(
            new utils.BigNum(pallet.assset.security)
        );
        const updatedCarrier = {
            ...carrier,
            balance: carrierBalanceWithSecurity.toString()

        };
        store.account.set(carrier.address, updatedCarrier);
        /* --- Revert pallet account --- */
        const updatedData = {
            asset: {
                deliveryStatus: "pending",
                carrier: null
            }
        };
        const newPallet = {
            ...pallet,
            ...updatedData
        };
        store.account.set(pallet.address, newPallet);
        return errors;
    }

}

module.exports = StartTransportTransaction;
