const categorySchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Der Name der Kategorie ist erforderlich.'], 
        minlength: [3, 'Der Name der Kategorie muss mindestens 3 Zeichen lang sein.'],
        unique: true // Name muss eindeutig sein
    },
    description: {
        type: String,
        maxlength: [500, 'Die Beschreibung darf maximal 500 Zeichen lang sein.']
    },
    parent_category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    created_at: { type: Date, default: Date.now },
});

