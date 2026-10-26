import { useMemo, useState } from "react";
import { FlatList, Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, MagnifyingGlass, XCircle } from "phosphor-react-native";
import countries from "world-countries";
import { Fonts, Radius } from "../constants/theme";
import { useTheme } from "../context/ThemeContext";

const COUNTRY_LIST = countries
  .map((c) => ({ code: c.cca2, name: c.name.common }))
  .sort((a, b) => a.name.localeCompare(b.name));

function getFlagEmoji(code) {
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

export default function CountryPickerModal({ visible, onClose, onSelect }) {
  const { colors } = useTheme();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return COUNTRY_LIST;
    return COUNTRY_LIST.filter((c) =>
      c.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={10}
              style={{ marginRight: 14, width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgCard, alignItems: "center", justifyContent: "center" }}
            >
              <X size={20} color={colors.textPrimary} weight="bold" />
            </TouchableOpacity>
            <Text style={{ fontFamily: Fonts.friendly, fontSize: 20, letterSpacing: -0.1, color: colors.textPrimary }}>
              Select country
            </Text>
          </View>

          {/* Search */}
          <View style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.bgCard, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: query ? colors.accent : colors.border, paddingHorizontal: 14, paddingVertical: 4, gap: 10 }}>
              <MagnifyingGlass size={17} color={query ? colors.accent : colors.textMuted} weight={query ? "bold" : "regular"} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search countries…"
                placeholderTextColor={colors.textMuted}
                autoFocus
                autoCorrect={false}
                style={{ fontFamily: Fonts.regular, fontSize: 15, lineHeight: 22, flex: 1, color: colors.textPrimary, paddingVertical: 10 }}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery("")} hitSlop={10}>
                  <XCircle size={18} color={colors.textMuted} weight="fill" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* List */}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.code}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={20}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => { onSelect(item); onClose(); }}
                activeOpacity={0.6}
                style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 14 }}
              >
                <Text style={{ fontSize: 24 }}>{getFlagEmoji(item.code)}</Text>
                <Text style={{ fontFamily: Fonts.regular, fontSize: 15, lineHeight: 22, color: colors.textPrimary }}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={{ fontFamily: Fonts.regular, fontSize: 15, color: colors.textMuted, textAlign: "center", marginTop: 40 }}>
                No countries match "{query}".
              </Text>
            }
          />
        </SafeAreaView>
      </View>
    </Modal>
  );
}
