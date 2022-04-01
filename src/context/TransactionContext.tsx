import React, { useEffect, useState } from 'react'
import { ethers } from 'ethers';
import { contractABI, contractAddress } from '../utils/constants';

export const TransactionContext = React.createContext({
    connectWallet: () => { }, currentAccount: '', formData: {}, sendTransaction: () => { }, handleChange: (e: any, name: string) => { }, transactions: [], isLoading: false
});

const { ethereum }: any = window;

const getEthereumContract = () => {
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    return new ethers.Contract(contractAddress, contractABI, signer);
};

export const TransactionProvider = ({ children }) => {
    const [currentAccount, setCurrentAccount] = useState('');
    const [formData, setFormData] = useState({ addressTo: '', amount: '', keyword: '', message: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [transactionCount, setTransactionCount] = useState(localStorage.getItem("transactionCount"));
    const [transactions, setTransactions] = useState();

    const handleChange = (e, name) => {
        setFormData((prevState) => ({
            ...prevState,
            [name]: e.target.value,
        }))
    };

    const getAllTransactions = async () => {
        try {
            if (!ethereum) return alert('Please install and enable metamask!');
            const transactionContract = getEthereumContract();
            const availableTransactions = await transactionContract.getAllTransactions();
            const structuredTransactions = availableTransactions.map((transaction) => ({
                addressTo: transaction.receiver,
                addressFrom: transaction.sender,
                timestamp: new Date(transaction.timestamp.toNumber() * 1000).toLocaleString(),
                message: transaction.message,
                keyword: transaction.keyword,
                amount: parseInt(transaction.amount._hex) / (10 ** 18)
            }));
            setTransactions(structuredTransactions);
        } catch (err) {
            console.log(err);
            throw new Error('No ethereum wallet');
        }
    };

    const checkIfWalletIsConnected = async () => {
        try {
            if (!ethereum) return alert('Please install and enable metamask!');
            const accounts = await ethereum.request({ method: 'eth_accounts' });
            if (accounts.length) {
                setCurrentAccount(accounts[0]);
                getAllTransactions();
            } else {
                console.log("No accounts found");
            }
        } catch (err) {
            console.log(err);
            throw new Error('No ethereum wallet');
        }
    };

    const checkIfTransactionsExist = async () => {
        try {
            if (!ethereum) return alert('Please install and enable metamask!');
            const transactionContract = getEthereumContract();
            const transactionsCount = await transactionContract.getTransactionCount();

            window.localStorage.setItem('transactionCount', transactionsCount);
        } catch (err) {
            console.log(err);
            throw new Error('No ethereum wallet');
        }
    };

    const connectWallet = async () => {
        try {
            if (!ethereum) return alert('Please install and enable metamask!');

            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
            setCurrentAccount(accounts[0]);
        } catch (err) {
            console.log(err);
            throw new Error('No ethereum wallet');
        }
    };

    const sendTransaction = async () => {
        try {
            if (!ethereum) return alert('Please install and enable metamask!');
            const { addressTo, amount, keyword, message } = formData;
            const transactionContract = getEthereumContract();
            const parsedAmount = ethers.utils.parseEther(amount);

            await ethereum.request({
                method: "eth_sendTransaction",
                params: [{
                    from: currentAccount,
                    to: addressTo,
                    gas: "0x5208",
                    value: parsedAmount._hex,
                }],
            });

            const transactionHash = await transactionContract.addToBlockchain(addressTo, parsedAmount, message, keyword);
            setIsLoading(true);
            console.log(`Loading - ${transactionHash.hash}`);
            await transactionHash.wait();
            console.log(`Success - ${transactionHash.hash}`);
            setIsLoading(false);

            const transactionsCount = await transactionContract.getTransactionCount();

            setTransactionCount(transactionsCount.toNumber());
        } catch (err) {
            console.log(err)
            throw Error('No ethereum object')
        }
    };

    useEffect(() => {
        checkIfWalletIsConnected();
        checkIfTransactionsExist();
    }, []);


    return (
        <TransactionContext.Provider value={{ connectWallet, currentAccount, formData, sendTransaction, handleChange, transactions, isLoading }}>
            {children}
        </TransactionContext.Provider>
    )
}