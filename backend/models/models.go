package models

type ListItem struct {
	IngredientID   bson.ObjectID `bson:"ingredient_id" json:"ingredient_id"`
	IngredientName string        `bson:"ingredient_name" json:"ingredient_name"`
	Quantity       float64       `bson:"quantity" json:"quantity"`
}

type List struct {
	ID     bson.ObjectID `bson:"_id,omitempty" json:"list_id"`
	UserID bson.ObjectID `bson:"user_id" json:"user_id"`
	Items  []ListItem    `bson:"items" json:"items"`
}

type OperatingHours struct {
	OpenTime  string `bson:"open_time" json:"open_time"`
	CloseTime string `bson:"close_time" json:"close_time"`
}

type Item struct {
	ID              bson.ObjectID `bson:"_id,omitempty" json:"ingredient_id"`
	IngredientName  string        `bson:"ingredient_name" json:"ingredient_name"`
	MeasurementUnit float64       `bson:"measurement_unit" json:"measurement_unit"`
}

type UserCredentials struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}
