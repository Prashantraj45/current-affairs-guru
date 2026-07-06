import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppTabParamList, HomeStackParamList, DiscoverStackParamList, PracticeStackParamList, HistoryStackParamList, ProfileStackParamList } from './types';
import FeedScreen from '../features/feed/screens/FeedScreen';
import TopicDetailScreen from '../features/topic/screens/TopicDetailScreen';
import SearchScreen from '../features/search/screens/SearchScreen';
import HistoryScreen from '../features/history/screens/HistoryScreen';
import MCQScreen from '../features/mcq/screens/MCQScreen';
import InsightsScreen from '../features/insights/screens/InsightsScreen';
import BookmarksScreen from '../features/bookmarks/screens/BookmarksScreen';
import SettingsScreen from '../features/settings/screens/SettingsScreen';
import { useTheme } from '../hooks/useTheme';

const Tab = createBottomTabNavigator<AppTabParamList>();
function HomeStack() { const S = createNativeStackNavigator<HomeStackParamList>(); return <S.Navigator><S.Screen name="Feed" component={FeedScreen} options={{ title: 'Today' }} /><S.Screen name="TopicDetail" component={TopicDetailScreen} options={{ title: '' }} /></S.Navigator>; }
function DiscoverStack() { const S = createNativeStackNavigator<DiscoverStackParamList>(); return <S.Navigator><S.Screen name="Search" component={SearchScreen} options={{ title: 'Search' }} /><S.Screen name="TopicDetail" component={TopicDetailScreen} options={{ title: '' }} /></S.Navigator>; }
function PracticeStack() { const S = createNativeStackNavigator<PracticeStackParamList>(); return <S.Navigator><S.Screen name="MCQ" component={MCQScreen} options={{ title: 'Practice' }} /><S.Screen name="Insights" component={InsightsScreen} options={{ title: 'Insights' }} /></S.Navigator>; }
function HistoryStack() { const S = createNativeStackNavigator<HistoryStackParamList>(); return <S.Navigator><S.Screen name="HistoryList" component={HistoryScreen} options={{ title: 'History' }} /><S.Screen name="TopicDetail" component={TopicDetailScreen} options={{ title: '' }} /></S.Navigator>; }
function ProfileStack() { const S = createNativeStackNavigator<ProfileStackParamList>(); return <S.Navigator><S.Screen name="Bookmarks" component={BookmarksScreen} options={{ title: 'Bookmarks' }} /><S.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} /></S.Navigator>; }

export default function AppNavigator() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: colors.card }, tabBarActiveTintColor: colors.primary }}>
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Discover" component={DiscoverStack} />
      <Tab.Screen name="Practice" component={PracticeStack} />
      <Tab.Screen name="History" component={HistoryStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}
