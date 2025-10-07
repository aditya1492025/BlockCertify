import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [network, setNetwork] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        setLoading(true);
        
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Create provider and signer
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        const web3Signer = web3Provider.getSigner();
        const userAccount = await web3Signer.getAddress();
        const networkInfo = await web3Provider.getNetwork();
        
        setProvider(web3Provider);
        setSigner(web3Signer);
        setAccount(userAccount);
        setNetwork(networkInfo);
        setConnected(true);
        
        return userAccount;
      } catch (error) {
        console.error('Error connecting wallet:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    } else {
      throw new Error('MetaMask is not installed');
    }
  };

  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setNetwork(null);
    setConnected(false);
  };

  // Check if wallet is already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            await connectWallet();
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };

    checkConnection();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          connectWallet();
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  const value = {
    provider,
    signer,
    account,
    network,
    connected,
    loading,
    connectWallet,
    disconnectWallet
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};