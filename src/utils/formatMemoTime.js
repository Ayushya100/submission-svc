'use strict';

const formatMemory = (kb) => {
  return (kb / 1024).toFixed(2) + ' MB';
};

const formatTime = (sec) => {
  return (sec * 1000).toFixed(0) + ' ms';
};

export { formatMemory, formatTime };
