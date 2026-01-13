// ============================================================================
// USER MODEL
// ============================================================================
// Represents a user account

const { DataTypes } = require('sequelize');
const { sequelize } = require('../connection');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false
  },
  username: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
    validate: {
      isEmail: true
    }
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true
});

module.exports = User;

