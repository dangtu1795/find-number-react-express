const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const gameSchema = new Schema(
    {
        current_number: {
            type: Number,
            default: 1
        },
        players: {
            _id: false,
            type: [{
                id: String,
                selected: {
                    type: [Number],
                    default: []
                },
                name: String,
            }],
            default: [],
            required: true
        },
        range: {
            type: Number,
            required: true,
            default: 0
        }
    },
    {
        timestamps: false
    });

const User = mongoose.model("Game", gameSchema);
module.exports = User;
