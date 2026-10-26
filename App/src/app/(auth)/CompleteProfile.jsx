import { Camera, Check, CaretRight } from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  SlideInRight,
  SlideOutLeft,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import AuthInput from "../../components/AuthInput";
import CountryPickerModal from "../../components/CountryPickerModal";
import { CATEGORIES, Fonts, Radius } from "../../constants/theme";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { useUpdateProfile } from "../../hooks/useProfile";
import { normalizeError } from "../../utils/helpers";

const TOTAL_STEPS = 4;
const GENDERS = ["Female", "Male", "Non-binary", "Prefer not to say"];

function StepDots({ step }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View
          key={i}
          style={{
            height: 3,
            borderRadius: 2,
            width: i === step ? 24 : 8,
            backgroundColor: i <= step ? colors.accent : colors.border,
          }}
        />
      ))}
    </View>
  );
}

function StepHeader({ step, title, subtitle }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: 32 }}>
      {/* Step counter — Inter, functional metadata */}
      <Text
        style={{
          fontFamily: Fonts.medium,
          fontSize: 11,
          letterSpacing: 2,
          color: colors.textMuted,
          marginBottom: 10,
        }}
      >
        STEP {step + 1} OF {TOTAL_STEPS}
      </Text>

      {/* Title — Fredoka, biggest brand voice on the screen */}
      <Text
        style={{
          fontFamily: Fonts.friendly,
          fontSize: 28,
          lineHeight: 34,
          letterSpacing: -0.2,
          color: colors.textPrimary,
          marginBottom: 8,
        }}
      >
        {title}
      </Text>

      {/* Subtitle — Inter, readable paragraph */}
      <Text
        style={{
          fontFamily: Fonts.regular,
          fontSize: 15,
          lineHeight: 23,
          color: colors.textSecondary,
        }}
      >
        {subtitle}
      </Text>
    </View>
  );
}

function NavRow({ onBack, onNext, nextLabel, nextDisabled, showBack, loading }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
      {showBack && (
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={{
            height: 54,
            paddingHorizontal: 22,
            borderRadius: Radius.lg,
            borderWidth: 1.5,
            borderColor: colors.border,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Back button — Fredoka */}
          <Text
            style={{
              fontFamily: Fonts.friendly,
              fontSize: 15,
              letterSpacing: 0.2,
              color: colors.textSecondary,
            }}
          >
            Back
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={onNext}
        disabled={nextDisabled || loading}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={nextLabel}
        accessibilityState={{ disabled: nextDisabled || loading }}
        style={{
          flex: 1,
          height: 54,
          borderRadius: Radius.lg,
          backgroundColor: colors.accent,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {loading ? (
          <ActivityIndicator color={colors.textInverse} />
        ) : (
          /* Primary button — Fredoka */
          <Text
            style={{
              fontFamily: Fonts.friendly,
              fontSize: 16,
              letterSpacing: 0.3,
              color: colors.textInverse,
            }}
          >
            {nextLabel}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ── Step 0: Photo + name / bio ───────────────────────────────────────────────
function PhotoStep({ photo, setPhoto, name, setName, bio, setBio, onNext }) {
  const { colors } = useTheme();
  const { toast } = useToast();
  async function handlePickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      toast.warn("Allow photo access to set a profile picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPhoto(result.assets[0].uri);
    }
  }

  return (
    <View>
      <StepHeader
        step={0}
        title="Add a photo"
        subtitle="A face and a name help people know who they're following."
      />

      <View style={{ alignItems: "center", marginBottom: 32 }}>
        <TouchableOpacity
          onPress={handlePickPhoto}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Pick profile photo"
        >
          {photo ? (
            <Image
              source={{ uri: photo }}
              style={{ width: 100, height: 100, borderRadius: 50 }}
            />
          ) : (
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                borderWidth: 1.5,
                borderColor: colors.border,
                borderStyle: "dashed",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.bgCard,
              }}
            >
              <Camera size={26} color={colors.textMuted} weight="duotone" />
            </View>
          )}

          {/* Camera badge */}
          <View
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: colors.accent,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 2,
              borderColor: colors.bg,
            }}
          >
            <Check size={16} color="#fff" weight="bold" />
          </View>
        </TouchableOpacity>

        {/* Helper text — Inter */}
        <Text
          style={{
            fontFamily: Fonts.regular,
            fontSize: 13,
            color: colors.textMuted,
            marginTop: 12,
          }}
        >
          {photo ? "Tap to change" : "Tap to upload"}
        </Text>
      </View>

      <AuthInput
        label="Display name"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />
      <AuthInput
        label="Short bio"
        value={bio}
        onChangeText={setBio}
        multiline
        helper="Optional — shown on your profile."
      />

      <NavRow onNext={onNext} nextLabel="Continue" showBack={false} />
    </View>
  );
}

// ── Step 1: Location ─────────────────────────────────────────────────────────
function LocationStep({ country, setCountry, city, setCity, onNext, onBack }) {
  const { colors } = useTheme();
  const [pickerOpen, setPickerOpen] = useState(false);

  function handleSelect(c) {
    Haptics.selectionAsync();
    setCountry(c);
  }

  return (
    <View>
      <StepHeader
        step={1}
        title="Where are you based?"
        subtitle="Helps surface locally relevant memes and creators."
      />

      {/* Section label — Fredoka, matches every other eyebrow */}
      <Text
        style={{
          fontFamily: Fonts.friendly,
          fontSize: 12,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          color: colors.textSecondary,
          marginBottom: 10,
        }}
      >
        Country
      </Text>

      <TouchableOpacity
        onPress={() => setPickerOpen(true)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={
          country ? `Country: ${country.name}` : "Select country"
        }
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 14,
          borderBottomWidth: 1.5,
          borderBottomColor: country ? colors.accent : colors.border,
          marginBottom: 24,
        }}
      >
        {country ? (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ fontSize: 22, marginRight: 12 }}>
              {country.code
                .toUpperCase()
                .replace(/./g, (c) =>
                  String.fromCodePoint(127397 + c.charCodeAt(0))
                )}
            </Text>
            {/* Selected country — Inter, it's a value */}
            <Text
              style={{
                fontFamily: Fonts.regular,
                fontSize: 15,
                color: colors.textPrimary,
              }}
            >
              {country.name}
            </Text>
          </View>
        ) : (
          /* Placeholder — Inter */
          <Text
            style={{
              fontFamily: Fonts.regular,
              fontSize: 15,
              color: colors.textMuted,
            }}
          >
            Select your country
          </Text>
        )}
        <CaretRight size={18} color={colors.textMuted} />
      </TouchableOpacity>

      <AuthInput
        label="City"
        value={city}
        onChangeText={setCity}
      />

      <NavRow onNext={onNext} nextLabel="Continue" showBack onBack={onBack} />

      {/* Skip link — Fredoka, inline action */}
      <TouchableOpacity
        onPress={onNext}
        style={{ alignSelf: "center", marginTop: 20 }}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Skip location"
      >
        <Text
          style={{
            fontFamily: Fonts.friendly,
            fontSize: 13,
            letterSpacing: 0.2,
            color: colors.textMuted,
          }}
        >
          Skip for now
        </Text>
      </TouchableOpacity>

      <CountryPickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelect}
      />
    </View>
  );
}

// ── Step 2: Gender ───────────────────────────────────────────────────────────
function GenderStep({ gender, setGender, onNext, onBack }) {
  const { colors } = useTheme();
  function handleSelect(g) {
    Haptics.selectionAsync();
    setGender(g);
  }

  return (
    <View>
      <StepHeader
        step={2}
        title="A little about you"
        subtitle="Optional — used only to personalise your experience."
      />

      <View style={{ marginBottom: 24 }}>
        {GENDERS.map((g) => {
          const active = gender === g;
          return (
            <TouchableOpacity
              key={g}
              onPress={() => handleSelect(g)}
              activeOpacity={0.6}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              {/* Gender option — Fredoka when active, Inter when inactive.
                  Font swap reinforces selection without relying on color. */}
              <Text
                style={{
                  fontFamily: active ? Fonts.friendly : Fonts.regular,
                  fontSize: 15,
                  color: active
                    ? colors.textPrimary
                    : colors.textSecondary,
                }}
              >
                {g}
              </Text>

              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 1.5,
                  borderColor: active ? colors.accent : colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {active && (
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: colors.accent,
                    }}
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <NavRow onNext={onNext} nextLabel="Continue" showBack onBack={onBack} />

      {/* Skip link — Fredoka */}
      <TouchableOpacity
        onPress={onNext}
        style={{ alignSelf: "center", marginTop: 20 }}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Skip gender"
      >
        <Text
          style={{
            fontFamily: Fonts.friendly,
            fontSize: 13,
            letterSpacing: 0.2,
            color: colors.textMuted,
          }}
        >
          Skip for now
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Step 3: Interests ────────────────────────────────────────────────────────
function InterestsStep({
  interests,
  toggleInterest,
  onFinish,
  onBack,
  loading,
}) {
  const { colors } = useTheme();
  const options = CATEGORIES.filter((c) => c.id !== "all");
  const canFinish = interests.size >= 2;

  return (
    <View>
      <StepHeader
        step={3}
        title="What do you want to see?"
        subtitle="Pick at least 2 topics to personalise your feed."
      />

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 32,
        }}
      >
        {options.map((c) => {
          const active = interests.has(c.id);
          return (
            <TouchableOpacity
              key={c.id}
              onPress={() => {
                Haptics.selectionAsync();
                toggleInterest(c.id);
              }}
              activeOpacity={0.6}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: Radius.lg,
                borderWidth: 1.5,
                borderColor: active ? colors.accent : colors.border,
                backgroundColor: active ? colors.accent : "transparent",
              }}
            >
              {/* Interest pill — Fredoka, matches every other pill in the app */}
              <Text
                style={{
                  fontFamily: Fonts.friendly,
                  fontSize: 14,
                  letterSpacing: 0.2,
                  color: active ? colors.textInverse : colors.textPrimary,
                }}
              >
                {c.label}
              </Text>
              {active && (
                <Check size={14} color="#fff" weight="bold" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <NavRow
        onNext={onFinish}
        nextLabel={canFinish ? "Start Exploring" : `Pick ${2 - interests.size} more`}
        nextDisabled={!canFinish}
        showBack
        onBack={onBack}
        loading={loading}
      />
    </View>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────
export default function CompleteProfileScreen() {
  const { colors, isDark } = useTheme();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState("forward");
  const [photo, setPhoto] = useState(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [country, setCountry] = useState(null);
  const [city, setCity] = useState("");
  const [gender, setGender] = useState(null);
  const [interests, setInterests] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { mutateAsync: updateProfile } = useUpdateProfile();

  function goTo(nextStep, dir) {
    setDirection(dir);
    setStep(nextStep);
  }

  function toggleInterest(id) {
    setInterests((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleFinish() {
    setLoading(true);
    setError("");
    try {
      await updateProfile({
        name: name.trim() || undefined,
        bio: bio.trim() || undefined,
        country: country?.code ?? undefined,
        city: city.trim() || undefined,
        gender: gender ?? undefined,
        interests: [...interests],
      });
      router.replace("/(tabs)");
    } catch (e) {
      setError(normalizeError(e));
    } finally {
      setLoading(false);
    }
  }

  const enterAnim =
    direction === "forward"
      ? SlideInRight.duration(220)
      : FadeIn.duration(180);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
          <View
            style={{
              paddingHorizontal: 28,
              paddingTop: 12,
              marginBottom: 8,
            }}
          >
            <StepDots step={step} />
          </View>

          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 28,
              paddingTop: 20,
              paddingBottom: 32,
              flexGrow: 1,
            }}
            keyboardShouldPersistTaps="handled"
          >
            {error ? (
              <Text
                style={{
                  fontFamily: Fonts.regular,
                  fontSize: 13,
                  color: colors.error,
                  marginBottom: 16,
                  textAlign: "center",
                }}
              >
                {error}
              </Text>
            ) : null}

            <Animated.View
              key={step}
              entering={enterAnim}
              exiting={SlideOutLeft.duration(150)}
            >
              {step === 0 && (
                <PhotoStep
                  photo={photo}
                  setPhoto={setPhoto}
                  name={name}
                  setName={setName}
                  bio={bio}
                  setBio={setBio}
                  onNext={() => goTo(1, "forward")}
                />
              )}
              {step === 1 && (
                <LocationStep
                  country={country}
                  setCountry={setCountry}
                  city={city}
                  setCity={setCity}
                  onNext={() => goTo(2, "forward")}
                  onBack={() => goTo(0, "back")}
                />
              )}
              {step === 2 && (
                <GenderStep
                  gender={gender}
                  setGender={setGender}
                  onNext={() => goTo(3, "forward")}
                  onBack={() => goTo(1, "back")}
                />
              )}
              {step === 3 && (
                <InterestsStep
                  interests={interests}
                  toggleInterest={toggleInterest}
                  onFinish={handleFinish}
                  onBack={() => goTo(2, "back")}
                  loading={loading}
                />
              )}
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}