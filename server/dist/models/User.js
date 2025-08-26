import mongoose, { Schema } from "mongoose";
const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    lastLogin: {
        type: Date,
        default: null
    },
    profile: {
        firstName: { type: String, trim: true },
        lastName: { type: String, trim: true },
        phone: { type: String, trim: true },
        dateOfBirth: { type: Date },
        avatar: { type: String }
    }
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt
    collection: 'users'
});
// Indexes for better query performance
UserSchema.index({ email: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ isActive: 1 });
// Virtual to get full name
UserSchema.virtual('fullName').get(function () {
    if (this.profile?.firstName && this.profile?.lastName) {
        return `${this.profile.firstName} ${this.profile.lastName}`;
    }
    return this.name;
});
// Method to check if user is recently active (logged in within 30 days)
UserSchema.methods.isRecentlyActive = function () {
    if (!this.lastLogin)
        return false;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return this.lastLogin > thirtyDaysAgo;
};
// Method to get user summary (without sensitive data)
UserSchema.methods.toPublicJSON = function () {
    return {
        id: this._id,
        email: this.email,
        name: this.name,
        fullName: this.fullName,
        isActive: this.isActive,
        emailVerified: this.emailVerified,
        lastLogin: this.lastLogin,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        profile: this.profile
    };
};
// Static method to find by email
UserSchema.statics.findByEmail = function (email) {
    return this.findOne({ email: email.toLowerCase() });
};
// Static method to get active users count
UserSchema.statics.getActiveUsersCount = function () {
    return this.countDocuments({ isActive: true });
};
// Pre-save middleware to ensure email is lowercase
UserSchema.pre('save', function (next) {
    if (this.isModified('email')) {
        this.email = this.email.toLowerCase();
    }
    next();
});
// Pre-save middleware to update the updatedAt field when profile is modified
UserSchema.pre('save', function (next) {
    if (this.isModified('profile')) {
        this.updatedAt = new Date();
    }
    next();
});
const User = mongoose.model('User', UserSchema);
export default User;
//# sourceMappingURL=User.js.map