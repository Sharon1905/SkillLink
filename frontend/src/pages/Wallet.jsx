import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, getUserType } from '../utils/auth';
import { isValidToken, secureStorage, sanitizeInput, generateSafeError } from '../utils/security';
import { FiDollarSign, FiPlus, FiMinus, FiClock, FiCheckCircle, FiXCircle, FiTrendingUp, FiTrendingDown, FiCreditCard, FiLock } from 'react-icons/fi';

function Wallet() {
  const navigate = useNavigate();
  const [walletData, setWalletData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  const userType = getUserType();

  const fetchWalletData = async () => {
    try {
      const token = secureStorage.getItem('access_token');
      if (!token || !isValidToken(token)) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/wallet`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch wallet data');
      }

      const data = await response.json();
      setWalletData(data);
    } catch (err) {
      setError(generateSafeError(err));
    }
  };

  const fetchTransactions = async () => {
    try {
      const token = secureStorage.getItem('access_token');
      if (!token || !isValidToken(token)) {
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/wallet/transactions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      setTransactions(data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setProcessing(true);
    try {
      const token = secureStorage.getItem('access_token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/wallet/deposit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount: parseFloat(depositAmount) })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to process deposit');
      }

      const result = await response.json();
      alert('Deposit successful!');
      setDepositAmount('');
      setShowDepositModal(false);
      fetchWalletData();
      fetchTransactions();
    } catch (err) {
      alert(`Deposit failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (parseFloat(withdrawAmount) > walletData.balance) {
      alert('Insufficient balance');
      return;
    }

    setProcessing(true);
    try {
      const token = secureStorage.getItem('access_token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/wallet/withdraw`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount: parseFloat(withdrawAmount) })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to process withdrawal');
      }

      const result = await response.json();
      alert('Withdrawal successful!');
      setWithdrawAmount('');
      setShowWithdrawModal(false);
      fetchWalletData();
      fetchTransactions();
    } catch (err) {
      alert(`Withdrawal failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'deposit':
        return <FiPlus className="text-green-500" size={20} />;
      case 'withdrawal':
        return <FiMinus className="text-red-500" size={20} />;
      case 'payment':
        return <FiDollarSign className="text-blue-500" size={20} />;
      case 'lock':
        return <FiLock className="text-yellow-500" size={20} />;
      case 'unlock':
        return <FiLock className="text-green-500" size={20} />;
      default:
        return <FiDollarSign className="text-gray-500" size={20} />;
    }
  };

  const getTransactionColor = (type, amount) => {
    if (type === 'deposit' || (type === 'payment' && amount > 0)) {
      return 'text-green-400';
    } else if (type === 'withdrawal' || (type === 'payment' && amount < 0)) {
      return 'text-red-400';
    } else {
      return 'text-blue-400';
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchWalletData();
      await fetchTransactions();
      setLoading(false);
    };

    if (isAuthenticated()) {
      loadData();
    } else {
      navigate('/login');
    }
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 text-dark-50 flex items-center justify-center">
        Loading wallet...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-900 text-red-500 flex items-center justify-center">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-dark-50">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark-50 mb-2">Wallet</h1>
          <p className="text-dark-300">Manage your funds and view transaction history</p>
        </div>

        {/* Wallet Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Available Balance */}
          <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-500/20 p-3 rounded-md">
                  <FiCreditCard className="text-green-500" size={24} />
                </div>
                <div>
                  <h3 className="text-dark-300 text-sm">Available Balance</h3>
                  <p className="text-2xl font-bold text-green-400">${walletData?.balance?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDepositModal(true)}
                className="flex-1 bg-green-500 hover:bg-green-600 text-dark-50 py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
              >
                <FiPlus size={16} />
                Add Money
              </button>
              <button
                onClick={() => setShowWithdrawModal(true)}
                className="flex-1 bg-dark-700 hover:bg-dark-600 text-dark-100 py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
              >
                <FiMinus size={16} />
                Withdraw
              </button>
            </div>
          </div>

          {/* Locked Balance (for orgs) or Pending (for players) */}
          <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-yellow-500/20 p-3 rounded-md">
                <FiLock className="text-yellow-500" size={24} />
              </div>
              <div>
                <h3 className="text-dark-300 text-sm">
                  {userType === 'org' ? 'Locked Balance' : 'Pending Payments'}
                </h3>
                <p className="text-2xl font-bold text-yellow-400">
                  ${walletData?.locked_balance?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
            <p className="text-dark-300 text-sm">
              {userType === 'org' 
                ? 'Funds locked in active gigs' 
                : 'Payments pending completion'
              }
            </p>
          </div>

          {/* Total Stats */}
          <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-500/20 p-3 rounded-md">
                {userType === 'org' ? (
                  <FiTrendingDown className="text-blue-500" size={24} />
                ) : (
                  <FiTrendingUp className="text-blue-500" size={24} />
                )}
              </div>
              <div>
                <h3 className="text-dark-300 text-sm">
                  {userType === 'org' ? 'Total Spent' : 'Total Earned'}
                </h3>
                <p className="text-2xl font-bold text-blue-400">
                  ${userType === 'org' 
                    ? walletData?.total_spent?.toFixed(2) || '0.00'
                    : walletData?.total_earned?.toFixed(2) || '0.00'
                  }
                </p>
              </div>
            </div>
            <p className="text-dark-300 text-sm">
              {userType === 'org' ? 'Total amount spent on gigs' : 'Total amount earned from gigs'}
            </p>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-dark-800 rounded-lg border border-dark-700">
          <div className="p-6 border-b border-dark-700">
            <h2 className="text-xl font-bold text-dark-50">Transaction History</h2>
          </div>
          <div className="p-6">
            {transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-4 bg-dark-750 rounded-lg">
                    <div className="flex items-center gap-4">
                      {getTransactionIcon(tx.transaction_type)}
                      <div>
                        <p className="text-dark-50 font-medium">{tx.description}</p>
                        <p className="text-dark-300 text-sm">
                          {new Date(tx.created_at).toLocaleDateString()} at {new Date(tx.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${getTransactionColor(tx.transaction_type, tx.amount)}`}>
                        {tx.amount > 0 ? '+' : ''}${tx.amount.toFixed(2)}
                      </p>
                      <p className="text-dark-300 text-sm capitalize">{tx.transaction_type}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FiCreditCard className="text-dark-300 mx-auto mb-4" size={48} />
                <h3 className="text-dark-300 text-lg mb-2">No transactions yet</h3>
                <p className="text-dark-400">Your transaction history will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Deposit Modal */}
        {showDepositModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-bold text-dark-50 mb-4">Add Money to Wallet</h3>
              <div className="mb-4">
                <label className="block text-dark-300 text-sm mb-2">Amount ($)</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full bg-dark-700 border border-dark-600 rounded-md px-3 py-2 text-dark-50 focus:outline-none focus:border-primary-500"
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleDeposit}
                  disabled={processing}
                  className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-dark-600 text-dark-50 py-2 px-4 rounded-md transition-colors"
                >
                  {processing ? 'Processing...' : 'Add Money'}
                </button>
                <button
                  onClick={() => setShowDepositModal(false)}
                  className="flex-1 bg-dark-700 hover:bg-dark-600 text-dark-100 py-2 px-4 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Withdraw Modal */}
        {showWithdrawModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-bold text-dark-50 mb-4">Withdraw from Wallet</h3>
              <div className="mb-4">
                <label className="block text-dark-300 text-sm mb-2">Amount ($)</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full bg-dark-700 border border-dark-600 rounded-md px-3 py-2 text-dark-50 focus:outline-none focus:border-primary-500"
                  placeholder="Enter amount"
                  min="0"
                  max={walletData?.balance}
                  step="0.01"
                />
                <p className="text-dark-300 text-sm mt-1">
                  Available: ${walletData?.balance?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleWithdraw}
                  disabled={processing}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-dark-600 text-dark-50 py-2 px-4 rounded-md transition-colors"
                >
                  {processing ? 'Processing...' : 'Withdraw'}
                </button>
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 bg-dark-700 hover:bg-dark-600 text-dark-100 py-2 px-4 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Wallet; 