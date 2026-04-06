// Write User as the base user model that only contains data and behavior shared by both Patient and Caregiver.

// In User.js, put:

// shared attributes:

// userId
// role
// phoneNum
// email
// password (just prototype data)
// a constructor(...) that assigns those fields

// simple methods that belong to the user itself, like:

// updatePhoneNum(phoneNum)
// updateEmail(email)
// getRole()
// isPatient()
// isCaregiver()

// Do not put these in User as these are services that will be implemented in the future:

// login()
// logout()
// register()
// changePassword()
// softDeleteAccount()