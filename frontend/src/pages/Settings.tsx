import React, { useEffect, useState } from 'react';
import {
  Shield, Bell, Bot, Link as LinkIcon, Palette,
  User, Mail, Lock, Save, Loader2, CheckCircle2, AlertCircle, LogOut,
  Users, UserPlus, Trash2, ShieldCheck
} from 'lucide-react';
import {
  getProfile, updateProfile, changePassword, logout, AuthUser,
  listUsers, createUser, deleteUser, UserListItem
} from '../lib/api';

export function Settings() {
  // ── Profil ──────────────────────────────────────────────────
  const [user, setUser] = useState<AuthUser | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // ── Mot de passe ────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // ── Gestion des utilisateurs (admin uniquement) ─────────────
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [usersMsg, setUsersMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    getProfile()
      .then((res) => {
        setUser(res.data);
        setFullName(res.data.full_name || '');
        setEmail(res.data.email);
        // La liste des utilisateurs n'est accessible qu'aux admins.
        if (res.data.is_admin) {
          loadUsers();
        }
      })
      .catch(() => setProfileMsg({ type: 'err', text: 'Impossible de charger le profil.' }));
  }, []);

  const loadUsers = async () => {
    try {
      const res = await listUsers();
      setUsers(res.data);
    } catch {
      setUsersMsg({ type: 'err', text: 'Impossible de charger les utilisateurs.' });
    }
  };

  const handleCreateUser = async () => {
    setUsersMsg(null);
    if (!newEmail) {
      setUsersMsg({ type: 'err', text: "Renseignez l'email du nouvel utilisateur." });
      return;
    }

    setCreatingUser(true);
    try {
      const res = await createUser(newEmail, newName || undefined, newIsAdmin);
      setUsersMsg({
        type: 'ok',
        text: res.data.email_sent
          ? `Compte créé. Les identifiants ont été envoyés à ${newEmail}.`
          : `Compte créé, mais l'email n'a pas pu être envoyé. Vérifiez la configuration Resend.`,
      });
      setNewEmail('');
      setNewName('');
      setNewIsAdmin(false);
      loadUsers();
    } catch (err: any) {
      setUsersMsg({
        type: 'err',
        text: err?.response?.data?.detail || 'Erreur lors de la création du compte.',
      });
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (id: number, userEmail: string) => {
    if (!window.confirm(`Supprimer définitivement le compte ${userEmail} ?`)) return;
    try {
      await deleteUser(id);
      setUsersMsg({ type: 'ok', text: 'Utilisateur supprimé.' });
      loadUsers();
    } catch (err: any) {
      setUsersMsg({
        type: 'err',
        text: err?.response?.data?.detail || 'Erreur lors de la suppression.',
      });
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await updateProfile({ full_name: fullName, email });
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      setProfileMsg({ type: 'ok', text: 'Profil mis à jour.' });
    } catch (err: any) {
      setProfileMsg({
        type: 'err',
        text: err?.response?.data?.detail || 'Erreur lors de la mise à jour.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordMsg(null);

    if (!currentPassword || !newPassword) {
      setPasswordMsg({ type: 'err', text: 'Renseignez le mot de passe actuel et le nouveau.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'err', text: 'Le nouveau mot de passe doit faire 6 caractères minimum.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'err', text: 'La confirmation ne correspond pas au nouveau mot de passe.' });
      return;
    }

    setSavingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordMsg({ type: 'ok', text: 'Mot de passe mis à jour.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMsg({
        type: 'err',
        text: err?.response?.data?.detail || 'Erreur lors du changement de mot de passe.',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const initials = (fullName || email || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const Message = ({ msg }: { msg: { type: 'ok' | 'err'; text: string } }) => (
    <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${
      msg.type === 'ok'
        ? 'bg-green-50 border border-green-200 text-green-700'
        : 'bg-red-50 border border-red-200 text-red-600'
    }`}>
      {msg.type === 'ok' ? (
        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
      )}
      {msg.text}
    </div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-black tracking-tight">Paramètres</h1>
        <p className="text-gray-500 mt-1">
          Gérez votre profil et les préférences de votre espace de travail.
        </p>
      </div>

      <div className="space-y-6">

        {/* ── Profil utilisateur ─────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
            <User className="w-5 h-5 text-[#333333]" />
            <h2 className="font-bold text-black">Mon profil</h2>
            {user?.is_admin && (
              <span className="ml-auto px-2.5 py-1 bg-[#ee3124]/10 text-[#ee3124] text-xs font-bold rounded-full border border-[#ee3124]/20">
                Administrateur
              </span>
            )}
          </div>

          <div className="p-6 space-y-6">
            {/* Avatar (initiales) */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#333333] text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
                {initials}
              </div>
              <div>
                <p className="font-bold text-black">{fullName || 'Sans nom'}</p>
                <p className="text-sm text-gray-500">{email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-[#333333] mb-2">
                  Nom complet
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl bg-white focus:ring-[#ee3124] focus:border-[#ee3124] text-sm"
                    placeholder="Votre nom"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#333333] mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl bg-white focus:ring-[#ee3124] focus:border-[#ee3124] text-sm"
                    placeholder="vous@entreprise.com"
                  />
                </div>
              </div>
            </div>

            {profileMsg && <Message msg={profileMsg} />}

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#ee3124] text-white font-bold rounded-xl hover:bg-[#d42b1f] transition-colors text-sm disabled:opacity-50"
              >
                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Enregistrer
              </button>

              <button
                onClick={logout}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-[#333333] font-bold rounded-xl hover:bg-gray-50 transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                Se déconnecter
              </button>
            </div>
          </div>
        </div>

        {/* ── Mot de passe ───────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#333333]" />
            <h2 className="font-bold text-black">Changer le mot de passe</h2>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#333333] mb-2">
                Mot de passe actuel
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white focus:ring-[#ee3124] focus:border-[#ee3124] text-sm"
                placeholder="••••••••"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-[#333333] mb-2">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white focus:ring-[#ee3124] focus:border-[#ee3124] text-sm"
                  placeholder="6 caractères minimum"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#333333] mb-2">
                  Confirmer le nouveau
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white focus:ring-[#ee3124] focus:border-[#ee3124] text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {passwordMsg && <Message msg={passwordMsg} />}

            <button
              onClick={handleChangePassword}
              disabled={savingPassword}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#333333] text-white font-bold rounded-xl hover:bg-black transition-colors text-sm disabled:opacity-50"
            >
              {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Mettre à jour le mot de passe
            </button>
          </div>
        </div>

        {/* ── Gestion des utilisateurs — ADMIN UNIQUEMENT ─────── */}
        {user?.is_admin && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#333333]" />
              <h2 className="font-bold text-black">Gestion des utilisateurs</h2>
              <span className="ml-auto px-2.5 py-1 bg-[#ee3124]/10 text-[#ee3124] text-xs font-bold rounded-full border border-[#ee3124]/20">
                Admin
              </span>
            </div>

            <div className="p-6 space-y-6">
              {/* Formulaire de création */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4">
                <p className="text-sm font-bold text-[#333333] flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Créer un nouvel utilisateur
                </p>
                <p className="text-xs text-gray-500">
                  Un mot de passe est généré automatiquement et envoyé par email
                  au nouvel utilisateur. Vous ne le verrez pas.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#333333] mb-1.5">
                      Email <span className="text-[#ee3124]">*</span>
                    </label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white focus:ring-[#ee3124] focus:border-[#ee3124] text-sm"
                      placeholder="collegue@entreprise.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#333333] mb-1.5">
                      Nom complet
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white focus:ring-[#ee3124] focus:border-[#ee3124] text-sm"
                      placeholder="Prénom Nom"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsAdmin}
                    onChange={(e) => setNewIsAdmin(e.target.checked)}
                    className="h-4 w-4 text-[#ee3124] focus:ring-[#ee3124] border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-[#333333]">
                    Donner les droits administrateur
                  </span>
                </label>

                <button
                  onClick={handleCreateUser}
                  disabled={creatingUser}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#ee3124] text-white font-bold rounded-xl hover:bg-[#d42b1f] transition-colors text-sm disabled:opacity-50"
                >
                  {creatingUser ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  Créer et envoyer les identifiants
                </button>
              </div>

              {usersMsg && <Message msg={usersMsg} />}

              {/* Liste des utilisateurs */}
              <div>
                <p className="text-sm font-bold text-[#333333] mb-3">
                  Utilisateurs ({users.length})
                </p>
                <div className="space-y-2">
                  {users.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-[#333333] flex-shrink-0">
                          {(u.full_name || u.email)
                            .split(' ')
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-black truncate">
                            {u.full_name || 'Sans nom'}
                            {u.id === user?.id && (
                              <span className="ml-2 text-xs font-medium text-gray-400">(vous)</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{u.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        {u.is_admin ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#ee3124]/10 text-[#ee3124] text-xs font-bold rounded-full border border-[#ee3124]/20">
                            <ShieldCheck className="w-3 h-3" />
                            Admin
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full border border-gray-200">
                            Utilisateur
                          </span>
                        )}

                        {u.id !== user?.id && (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.email)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer cet utilisateur"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Intégration Teams (à venir) ─────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-[#333333]" />
            <h2 className="font-bold text-black">Intégration Microsoft Teams</h2>
            <span className="ml-auto px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full border border-yellow-200">
              Bientôt disponible
            </span>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-500">
              Un bot rejoindra automatiquement vos réunions Teams pour les transcrire
              et générer le compte rendu en temps réel.
            </p>
          </div>
        </div>

        {/* ── Thème ──────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
            <Palette className="w-5 h-5 text-[#333333]" />
            <h2 className="font-bold text-black">Thème</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-500 mb-4">
              Le thème de l'espace de travail suit les couleurs de la marque.
            </p>
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-[#ee3124] ring-4 ring-gray-100" />
              <div className="w-12 h-12 rounded-full bg-[#333333] ring-4 ring-gray-100" />
              <div className="w-12 h-12 rounded-full bg-black ring-4 ring-gray-100" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}