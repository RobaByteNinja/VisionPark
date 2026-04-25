const { User, USER_ROLES } = require("./models/user.model");
const { ValidationError, ConflictError, NotFoundError } = require("../../common/errors");
const { hashPassword, toSafeUser } = require("../auth/auth.utils");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const hasValue = (value) =>
  value !== undefined && value !== null && String(value).trim().length > 0;

const sanitizeRoleProfiles = (role, payload = {}) => {
  const hasDriverProfile = payload.driverProfile !== undefined;
  const hasOwnerProfile = payload.ownerProfile !== undefined;
  const hasAttendantProfile = payload.attendantProfile !== undefined;

  if (role === "driver") {
    if (
      !hasDriverProfile ||
      !payload.driverProfile ||
      typeof payload.driverProfile !== "object"
    ) {
      throw new ValidationError("driverProfile is required when role is driver.");
    }
    if (!hasValue(payload.driverProfile.licensePlate)) {
      throw new ValidationError(
        "driverProfile.licensePlate is required when role is driver."
      );
    }
    if (hasOwnerProfile || hasAttendantProfile) {
      throw new ValidationError("Only driverProfile is allowed when role is driver.");
    }
    return {
      driverProfile: {
        phone: hasValue(payload.driverProfile.phone)
          ? String(payload.driverProfile.phone).trim()
          : null,
        licensePlate: String(payload.driverProfile.licensePlate).trim(),
        vehicleType: hasValue(payload.driverProfile.vehicleType)
          ? String(payload.driverProfile.vehicleType).trim()
          : null,
        licenseType: hasValue(payload.driverProfile.licenseType)
          ? String(payload.driverProfile.licenseType).trim()
          : null,
        region: hasValue(payload.driverProfile.region)
          ? String(payload.driverProfile.region).trim()
          : null,
      },
      ownerProfile: null,
      attendantProfile: null,
    };
  }

  if (role === "owner") {
    if (
      !hasOwnerProfile ||
      !payload.ownerProfile ||
      typeof payload.ownerProfile !== "object"
    ) {
      throw new ValidationError("ownerProfile is required when role is owner.");
    }
    if (hasDriverProfile || hasAttendantProfile) {
      throw new ValidationError("Only ownerProfile is allowed when role is owner.");
    }
    return {
      driverProfile: null,
      ownerProfile: {
        phone: hasValue(payload.ownerProfile.phone)
          ? String(payload.ownerProfile.phone).trim()
          : null,
        companyName: hasValue(payload.ownerProfile.companyName)
          ? String(payload.ownerProfile.companyName).trim()
          : null,
        tinNumber: hasValue(payload.ownerProfile.tinNumber)
          ? String(payload.ownerProfile.tinNumber).trim()
          : null,
      },
      attendantProfile: null,
    };
  }

  if (role === "attendant") {
    if (
      !hasAttendantProfile ||
      !payload.attendantProfile ||
      typeof payload.attendantProfile !== "object"
    ) {
      throw new ValidationError("attendantProfile is required when role is attendant.");
    }
    if (hasDriverProfile || hasOwnerProfile) {
      throw new ValidationError("Only attendantProfile is allowed when role is attendant.");
    }
    const ownerId = payload.attendantProfile.ownerId;
    const branchId = payload.attendantProfile.branchId;
    if (!hasValue(ownerId) || !hasValue(branchId)) {
      throw new ValidationError(
        "attendantProfile.ownerId and attendantProfile.branchId are required when role is attendant."
      );
    }
    return {
      driverProfile: null,
      ownerProfile: null,
      attendantProfile: {
        ownerId,
        branchId,
        phone: hasValue(payload.attendantProfile.phone)
          ? String(payload.attendantProfile.phone).trim()
          : null,
        shiftStart: hasValue(payload.attendantProfile.shiftStart)
          ? String(payload.attendantProfile.shiftStart).trim()
          : null,
        shiftEnd: hasValue(payload.attendantProfile.shiftEnd)
          ? String(payload.attendantProfile.shiftEnd).trim()
          : null,
      },
    };
  }

  if (hasDriverProfile || hasOwnerProfile || hasAttendantProfile) {
    throw new ValidationError("Role admin does not accept role-specific profiles.");
  }
  return {
    driverProfile: null,
    ownerProfile: null,
    attendantProfile: null,
  };
};

class UserService {
  async createUser(payload) {
    const { name, email, role, password } = payload || {};

    if (!name || !email || !role || !password) {
      throw new ValidationError("name, email, role, and password are required.");
    }
    if (typeof password !== "string" || password.length < 8) {
      throw new ValidationError("password must be at least 8 characters.");
    }
    if (!USER_ROLES.includes(role)) {
      throw new ValidationError(
        `role must be one of: ${USER_ROLES.join(", ")}.`
      );
    }
    if (!EMAIL_REGEX.test(String(email).trim().toLowerCase())) {
      throw new ValidationError("email must be a valid email address.");
    }

    const passwordHash = await hashPassword(password);
    const normalizedEmail = String(email).trim().toLowerCase();
    const { driverProfile, ownerProfile, attendantProfile } = sanitizeRoleProfiles(
      role,
      payload || {}
    );

    try {
      const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        role,
        passwordHash,
        status: "active",
        driverProfile,
        ownerProfile,
        attendantProfile,
      });
      return toSafeUser(user);
    } catch (error) {
      if (error && error.code === 11000) {
        throw new ConflictError("A user with this email already exists.");
      }
      throw error;
    }
  }

  async getUserById(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found.");
    }
    return toSafeUser(user);
  }
}

module.exports = {
  UserService,
};
