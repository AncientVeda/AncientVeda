import React, { useEffect } from 'react';
import styles from '../styles/Toast.module.css';

const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={styles.toast}>
      {message}
    </div>
  );
};

export default Toast;

