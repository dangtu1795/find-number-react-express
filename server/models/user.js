const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const userSchema = new Schema(
    {
        name: {
            type: String,
            required: true
        },
        last_time_active: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: false
    });

userSchema.index({ name: 1 });
userSchema.index({ id: 1 });

const User = mongoose.model("User", userSchema);
module.exports = User;
